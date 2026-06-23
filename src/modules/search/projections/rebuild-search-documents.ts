import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { CreatorPublicCardRow } from "@/modules/creator/public/creator-public-card-read-model"
import type { ContentPublicCardRow } from "@/modules/content/public/content-public-card-read-model"

import { upsertSearchDocument } from "@/modules/search/repositories/search-document-repository"

import {
  buildContentSearchDocument,
  buildCreatorSearchDocument,
  buildPostSearchDocument,
} from "./build-search-document"
import { logger } from "@/shared/observability/structured-logger"

type PostSearchSourceRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: string
  status: string
  deleted_at: string | null
  published_at: string | null
  updated_at: string | null
}

export async function rebuildSearchDocuments(input?: {
  limit?: number
  dryRun?: boolean
}) {
  const limit = Math.max(1, Math.min(input?.limit ?? 500, 5000))

  const [
    { data: creators, error: creatorsError },
    { data: contents, error: contentsError },
    { data: posts, error: postsError },
  ] = await Promise.all([
    supabaseAdmin
      .from("creator_public_cards")
      .select("*")
      .limit(limit)
      .returns<CreatorPublicCardRow[]>(),

    supabaseAdmin
      .from("content_public_cards")
      .select("*")
      .limit(limit)
      .returns<ContentPublicCardRow[]>(),

    supabaseAdmin
      .from("posts")
      .select(
        `
          id,
          creator_id,
          title,
          content,
          visibility,
          status,
          deleted_at,
          published_at,
          updated_at
        `
      )
  .is("deleted_at", null)
.not("published_at", "is", null)
.not("visibility_status", "eq", "rejected")
.not("moderation_status", "eq", "rejected")
.not("moderation_status", "eq", "needs_review")
      .limit(limit)
      .returns<PostSearchSourceRow[]>(),
  ])

  if (creatorsError) throw creatorsError
  if (contentsError) throw contentsError
  if (postsError) throw postsError

  const documents = [
    ...(creators ?? []).map(buildCreatorSearchDocument),
    ...(contents ?? []).map(buildContentSearchDocument),
    ...(posts ?? []).map(buildPostSearchDocument),
  ]

  const scannedCount = documents.length

  let upsertedCount = 0
  let failedCount = 0

  for (const document of documents) {
    try {
      if (!input?.dryRun) {
        const { error } = await upsertSearchDocument(document)

        if (error) {
          throw error
        }
      }

      upsertedCount += 1
    } catch (error) {
      logger.error({
        event: "search.rebuild_documents_upsert_failed",
        context: {
          documentType: document.document_type,
          sourceId: document.source_id,
        },
        error,
      })

      failedCount += 1
    }
  }

  return {
    scannedCount,
    upsertedCount,
    failedCount,

    creatorSourceCount: creators?.length ?? 0,
    contentSourceCount: contents?.length ?? 0,
    postSourceCount: posts?.length ?? 0,
  }
}
