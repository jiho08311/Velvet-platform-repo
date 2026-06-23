import { createHash } from "node:crypto"
import type { CreatorPublicCardRow } from "@/modules/creator/public/creator-public-card-read-model"
import type { ContentPublicCardRow } from "@/modules/content/public/content-public-card-read-model"
import type { UpsertSearchDocumentInput } from "@/modules/search/repositories/search-document-repository"

function hashSource(value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
}

function firstMediaStoragePath(card: ContentPublicCardRow): string | null {
  const mediaPreview = card.media_preview

  if (!Array.isArray(mediaPreview)) return null

  const first = mediaPreview[0]

  if (
    first &&
    typeof first === "object" &&
    "storagePath" in first &&
    typeof first.storagePath === "string"
  ) {
    return first.storagePath
  }

  return null
}

export function buildCreatorSearchDocument(
  card: CreatorPublicCardRow
): UpsertSearchDocumentInput {
  return {
    document_type: "creator",
    source_id: card.creator_id,
    creator_id: card.creator_id,
    user_id: card.user_id,
    title: card.display_name ?? card.username,
    body: card.bio,
    username: card.username,
    display_name: card.display_name,
    image_ref: card.avatar_url,
    visibility_state: card.is_public_visible ? "public" : "hidden",
    ranking_score: card.is_public_visible ? 100 : 0,
    source_hash: card.source_hash ?? hashSource(card),
    projection_version: 1,
    source_updated_at: card.updated_at,
  }
}

export function buildContentSearchDocument(
  card: ContentPublicCardRow
): UpsertSearchDocumentInput {
  return {
    document_type: "content",
    source_id: card.post_id,
    creator_id: card.creator_id,
    user_id: null,
    title: card.title,
    body: card.render_text_seed ?? card.content,
    username: null,
    display_name: null,
    image_ref: firstMediaStoragePath(card),
    visibility_state: card.is_public_visible ? "public" : "hidden",
    ranking_score:
      (card.is_public_visible ? 50 : 0) +
      Math.min(card.media_count * 5, 25),
    source_hash: card.source_hash ?? hashSource(card),
    projection_version: 1,
    source_updated_at: card.updated_at,
  }
}

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
  engagement_score?: number | null
  ranking_score?: number | null
}

export function buildPostSearchDocument(
  post: PostSearchSourceRow
): UpsertSearchDocumentInput {
  const isPublicVisible =
    post.deleted_at == null &&
    post.status === "published" &&
    post.visibility === "public" &&
    post.published_at != null

  return {
    document_type: "post",
    source_id: post.id,
    creator_id: post.creator_id,
    user_id: null,
    title: post.title,
    body: post.content,
    username: null,
    display_name: null,
    image_ref: null,
    visibility_state: isPublicVisible ? "public" : "hidden",
    ranking_score:
      isPublicVisible
        ? Number(post.ranking_score ?? post.engagement_score ?? 50)
        : 0,
    source_hash: hashSource(post),
    projection_version: 1,
    source_updated_at: post.updated_at,
  }
}