import { listCreatorPublicCardsByCreatorIds } from "@/modules/creator/public/creator-public-card-read-model"
import { upsertSearchDocument } from "@/modules/search/repositories/search-document-repository"
import { buildCreatorSearchDocument } from "./build-search-document"

export async function rebuildCreatorSearchDocument(input: {
  creatorId: string
}) {
  const cards = await listCreatorPublicCardsByCreatorIds([input.creatorId])
  const card = cards[0] ?? null

  if (!card) {
    return {
      status: "skipped" as const,
      reason: "creator_public_card_not_found",
    }
  }

  const document = buildCreatorSearchDocument(card)
  const { error } = await upsertSearchDocument(document)

  if (error) throw error

  return {
    status: "completed" as const,
    creatorId: input.creatorId,
  }
}