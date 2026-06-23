import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import {
  findCanonicalPostById,
  patchCanonicalPost,
  publishDueCanonicalScheduledPosts,
  type CanonicalPostRow,
} from "@/modules/post/repositories/canonical-post-repository"
import {
  replaceCanonicalPostBlocks,
  type CanonicalPostBlockInput,
} from "@/modules/post/repositories/canonical-post-block-repository"
import type { CurrentPostStatus } from "@/modules/post/repositories/post-repository"

export type CanonicalPostWriteRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  price: number
  published_at: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export type CreateCanonicalPostInput = {
  creatorId: string
  title?: string | null
  content?: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  price: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

function toWriteRow(row: CanonicalPostRow): CanonicalPostWriteRow {
  return {
    id: row.post_id,
    creator_id: row.creator_id,
    title: row.title,
    content: row.content,
    status: row.lifecycle_state,
    visibility: row.visibility,
    price: row.price,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  }
}

function toVisibilityState(
  status: CreateCanonicalPostInput["status"]
): CanonicalPostRow["visibility_state"] {
  return status === "published" ? "published" : "draft"
}

function toModerationState(
  status: CreateCanonicalPostInput["status"]
): CanonicalPostRow["moderation_state"] {
  return status === "published" ? "approved" : "pending"
}

export async function createCanonicalPost(
  input: CreateCanonicalPostInput
): Promise<CanonicalPostWriteRow> {
  const postId = crypto.randomUUID()

  const row = {
    post_id: postId,
    creator_id: input.creatorId,
    title: input.title ?? null,
    content: input.content ?? null,
    visibility: input.visibility,
    price: input.price,
    lifecycle_state: input.status,
    visibility_state: toVisibilityState(input.status),
    moderation_state: toModerationState(input.status),
    published_at: input.publishedAt,
    deleted_at: null,
    created_at: input.createdAt,
    updated_at: input.updatedAt,
  } satisfies CanonicalPostRow

  const { data, error } = await supabaseAdmin
    .from("canonical_posts")
    .insert(row)
    .select(
      "post_id, creator_id, title, content, visibility, price, lifecycle_state, visibility_state, moderation_state, published_at, deleted_at, created_at, updated_at"
    )
    .single<CanonicalPostRow>()

  if (error) throw error

  return toWriteRow(data)
}

export async function updateCanonicalPost(input: {
  postId: string
  creatorId: string
  updateData: Record<string, unknown>
}): Promise<CanonicalPostWriteRow> {
  const canonicalUpdateData: Record<string, unknown> = {}

  if ("title" in input.updateData) {
    canonicalUpdateData.title = input.updateData.title
  }

  if ("content" in input.updateData) {
    canonicalUpdateData.content = input.updateData.content
  }

  if ("visibility" in input.updateData) {
    canonicalUpdateData.visibility = input.updateData.visibility
  }

  if ("price" in input.updateData) {
    canonicalUpdateData.price = input.updateData.price
  }

  if ("published_at" in input.updateData) {
    canonicalUpdateData.published_at = input.updateData.published_at
  }

  if ("updated_at" in input.updateData) {
    canonicalUpdateData.updated_at = input.updateData.updated_at
  }

  if ("status" in input.updateData) {
    canonicalUpdateData.lifecycle_state = input.updateData.status
  }

  const { data, error } = await supabaseAdmin
    .from("canonical_posts")
    .update(canonicalUpdateData)
    .eq("post_id", input.postId)
    .eq("creator_id", input.creatorId)
    .is("deleted_at", null)
    .select(
      "post_id, creator_id, title, content, visibility, price, lifecycle_state, visibility_state, moderation_state, published_at, deleted_at, created_at, updated_at"
    )
    .single<CanonicalPostRow>()

  if (error) throw error

  return toWriteRow(data)
}

export async function findCurrentCanonicalPostStatusById(
  postId: string
): Promise<CurrentPostStatus> {
  const row = await findCanonicalPostById(postId)

  return row?.lifecycle_state ?? null
}

export async function updateCanonicalPostStatus(input: {
  postId: string
  updateData: Record<string, unknown>
}): Promise<void> {
  const updateData: Record<string, unknown> = {}

  if ("status" in input.updateData) {
    updateData.lifecycle_state = input.updateData.status
  }

  if ("visibility_status" in input.updateData) {
    updateData.visibility_state = input.updateData.visibility_status
  }

  if ("moderation_status" in input.updateData) {
    updateData.moderation_state =
      input.updateData.moderation_status === "published"
        ? "approved"
        : input.updateData.moderation_status
  }

  if ("published_at" in input.updateData) {
    updateData.published_at = input.updateData.published_at
  }

  if ("updated_at" in input.updateData) {
    updateData.updated_at = input.updateData.updated_at
  }

  await patchCanonicalPost({
    postId: input.postId,
    updateData,
  })
}

export async function publishDueCanonicalPosts(now: string): Promise<void> {
  await publishDueCanonicalScheduledPosts(now)
}

export function toCanonicalPostBlocks(
  blocks: Array<{
    post_id: string
    type: string
    content: string | null
    media_id: string | null
    sort_order: number
    editor_state: CanonicalPostBlockInput["editor_state"]
  }>
): CanonicalPostBlockInput[] {
  return blocks.map((block) => ({
    post_id: block.post_id,
    type: block.type as CanonicalPostBlockInput["type"],
    content: block.content,
    media_id: block.media_id,
    sort_order: block.sort_order,
    editor_state: block.editor_state,
  }))
}

export async function replaceCanonicalPostBlocksForPost(input: {
  postId: string
  blocks: Parameters<typeof toCanonicalPostBlocks>[0]
}): Promise<void> {
  await replaceCanonicalPostBlocks({
    postId: input.postId,
    blocks: toCanonicalPostBlocks(input.blocks),
  })
}

export type ContentModerationVisibility =
  | "VISIBLE"
  | "LIMITED"
  | "HIDDEN"
  | "REMOVED"

function toCanonicalVisibilityState(
  visibility: ContentModerationVisibility
): CanonicalPostRow["visibility_state"] {
  if (visibility === "VISIBLE") return "published"
  if (visibility === "LIMITED") return "processing"

  return "rejected"
}

function toCanonicalModerationState(
  visibility: ContentModerationVisibility
): CanonicalPostRow["moderation_state"] {
  if (visibility === "VISIBLE") return "approved"
  if (visibility === "LIMITED") return "needs_review"

  return "rejected"
}

export async function applyContentModerationVisibility(input: {
  postId: string
  visibility: ContentModerationVisibility
  reason: string
  occurredAt: string
}): Promise<void> {
  const updateData: Record<string, unknown> = {
    visibility_state: toCanonicalVisibilityState(input.visibility),
    moderation_state: toCanonicalModerationState(input.visibility),
    updated_at: input.occurredAt,
  }

  if (input.visibility === "REMOVED") {
    updateData.deleted_at = input.occurredAt
  }

  await patchCanonicalPost({
    postId: input.postId,
    updateData,
  })
}