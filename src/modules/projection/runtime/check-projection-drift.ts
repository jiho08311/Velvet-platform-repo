import {
  recordProjectionDriftReport,
  recordProjectionHealthCheck,
} from "@/modules/projection/repositories/projection-ops-repository"
import {
  countMissingContentPublicCards,
  countMissingCreatorPublicCards,
  countProjectionTableRows,
} from "@/modules/projection/repositories/projection-drift-read-repository"

type CountQueryFilter = Parameters<typeof countProjectionTableRows>[1]

async function countTable(table: string, filter?: CountQueryFilter) {
  return countProjectionTableRows(table, filter)
}

async function countRows(sqlName: string, queryBuilder: () => Promise<number>) {
  try {
    return await queryBuilder()
  } catch (error) {
    throw new Error(
      `${sqlName}: ${error instanceof Error ? error.message : "unknown error"}`
    )
  }
}

function calculateProjectionLag(input: {
  sourceCount: number
  projectionCount: number
}): number {
  return Math.max(0, input.sourceCount - input.projectionCount)
}

async function recordProjectionCheck(input: {
  projectionName: string
  sourceCount: number
  projectionCount: number
  driftCount: number
  details?: Record<string, unknown>
}) {
  const status = input.driftCount === 0 ? "ok" : "drift"
  const projectionLag = calculateProjectionLag({
    sourceCount: input.sourceCount,
    projectionCount: input.projectionCount,
  })

  await recordProjectionDriftReport({
    checkName: input.projectionName,
    sourceCount: input.sourceCount,
    projectionCount: input.projectionCount,
    driftCount: input.driftCount,
    status,
    details: input.details,
  })

  await recordProjectionHealthCheck({
    projectionName: input.projectionName,
    projectionLag,
    projectionDrift: input.driftCount,
    status,
    metadata: {
      sourceCount: input.sourceCount,
      projectionCount: input.projectionCount,
      ...(input.details ?? {}),
    },
  })
}

async function countMissingCreatorCards() {
  return countMissingCreatorPublicCards()
}

async function countMissingContentCards() {
  return countMissingContentPublicCards()
}

async function countMissingSearchDocuments() {
  const creatorCount = await countTable("creator_public_cards")
  const contentCount = await countTable("content_public_cards")
  const postCount = await countTable("posts", (query) =>
    query.is("deleted_at", null).not("published_at", "is", null)
  )

  const creatorDocumentCount = await countTable("search_documents", (query) =>
    query.eq("document_type", "creator")
  )
  const contentDocumentCount = await countTable("search_documents", (query) =>
    query.eq("document_type", "content")
  )
  const postDocumentCount = await countTable("search_documents", (query) =>
    query.eq("document_type", "post")
  )

  const sourceCount = creatorCount + contentCount + postCount
  const projectionCount =
    creatorDocumentCount + contentDocumentCount + postDocumentCount

  const missingCount =
    Math.max(0, creatorCount - creatorDocumentCount) +
    Math.max(0, contentCount - contentDocumentCount) +
    Math.max(0, postCount - postDocumentCount)

  return {
    sourceCount,
    projectionCount,
    driftCount: missingCount,
    details: {
      creatorCount,
      contentCount,
      postCount,
      creatorDocumentCount,
      contentDocumentCount,
      postDocumentCount,
    },
  }
}

export async function checkProjectionDrift() {
  const reports: Array<{
    checkName: string
    sourceCount: number
    projectionCount: number
    driftCount: number
  }> = []

  const creatorSourceCount = await countTable("creators")
  const creatorProjectionCount = await countTable("creator_public_cards")
  const missingCreatorCards = await countRows(
    "missing_creator_public_cards",
    countMissingCreatorCards
  )

  await recordProjectionCheck({
    projectionName: "creator_public_cards_vs_creators",
    sourceCount: creatorSourceCount,
    projectionCount: creatorProjectionCount,
    driftCount: missingCreatorCards,
  })

  reports.push({
    checkName: "creator_public_cards_vs_creators",
    sourceCount: creatorSourceCount,
    projectionCount: creatorProjectionCount,
    driftCount: missingCreatorCards,
  })

  const contentSourceCount = await countTable("canonical_feed_items", (query) =>
    query.eq("projection_surface", "home_feed").eq("is_feed_visible", true)
  )
  const contentProjectionCount = await countTable("content_public_cards")
  const missingContentCards = await countRows(
    "missing_content_public_cards",
    countMissingContentCards
  )

  await recordProjectionCheck({
    projectionName: "content_public_cards_vs_home_feed",
    sourceCount: contentSourceCount,
    projectionCount: contentProjectionCount,
    driftCount: missingContentCards,
  })

  reports.push({
    checkName: "content_public_cards_vs_home_feed",
    sourceCount: contentSourceCount,
    projectionCount: contentProjectionCount,
    driftCount: missingContentCards,
  })

  const search = await countMissingSearchDocuments()

  await recordProjectionCheck({
    projectionName: "search_documents_vs_sources",
    sourceCount: search.sourceCount,
    projectionCount: search.projectionCount,
    driftCount: search.driftCount,
    details: search.details,
  })

  reports.push({
    checkName: "search_documents_vs_sources",
    sourceCount: search.sourceCount,
    projectionCount: search.projectionCount,
    driftCount: search.driftCount,
  })

  return {
    reports,
    failedCount: reports.filter((report) => report.driftCount > 0).length,
  }
}
