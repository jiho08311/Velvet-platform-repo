import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { PostRow } from "./post-repository"
export type CanonicalPostRow = {
  post_id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number
  lifecycle_state: "draft" | "scheduled" | "published" | "archived"
  visibility_state: "draft" | "processing" | "published" | "rejected"
  moderation_state:
    | "pending"
    | "approved"
    | "needs_review"
    | "rejected"
    | "archived"
  published_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type LegacyPostLikeRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number | null
  status: "draft" | "scheduled" | "published" | "archived"
visibility_status?: "draft" | "processing" | "published" | "rejected" | null
moderation_status?:
  | "pending"
  | "approved"
  | "needs_review"
  | "rejected"
  | "archived"
  | "published"
  | null
  published_at: string | null
  deleted_at?: string | null
  created_at: string
  updated_at?: string | null
}

function normalizeCanonicalModerationState(
  state: LegacyPostLikeRow["moderation_status"]
): CanonicalPostRow["moderation_state"] {
  if (state === "approved" || state === "published") return "approved"
  if (state === "rejected") return "rejected"
  if (state === "needs_review") return "needs_review"
  if (state === "archived") return "archived"
  return "pending"
}

export function toCanonicalPostRow(
  row: LegacyPostLikeRow
): CanonicalPostRow {
  return {
    post_id: row.id,
    creator_id: row.creator_id,
    title: row.title,
    content: row.content,
    visibility: row.visibility,
    price: row.price ?? 0,
    lifecycle_state: row.status,
    visibility_state: row.visibility_status ?? "draft",
    moderation_state: normalizeCanonicalModerationState(row.moderation_status),
    published_at: row.published_at,
    deleted_at: row.deleted_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
  }
}

export async function findCanonicalPostById(
  postId: string
): Promise<CanonicalPostRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_posts")
    .select(
      "post_id, creator_id, title, content, visibility, price, lifecycle_state, visibility_state, moderation_state, published_at, deleted_at, created_at, updated_at"
    )
    .eq("post_id", postId)
    .maybeSingle<CanonicalPostRow>()

  if (error) {
    throw error
  }

  return data
}

function toLegacyPostRow(row: CanonicalPostRow): PostRow {
  return {
    id: row.post_id,
    creator_id: row.creator_id,
    title: row.title,
    content: row.content,
    visibility: row.visibility,
    price: row.price,
    status: row.lifecycle_state,
    visibility_status: row.visibility_state,
    moderation_status:
      row.moderation_state === "archived" ? "rejected" : row.moderation_state,
    created_at: row.created_at,
    published_at: row.published_at,
    deleted_at: row.deleted_at,
  }
}

export async function findCanonicalPostByIdAsLegacyRow(
  postId: string
): Promise<PostRow | null> {
  const row = await findCanonicalPostById(postId)

  return row ? toLegacyPostRow(row) : null
}

export async function upsertCanonicalPostFromLegacyRow(
  row: LegacyPostLikeRow
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_posts")
    .upsert(toCanonicalPostRow(row), {
      onConflict: "post_id",
    })

  if (error) {
    throw error
  }
}

export async function patchCanonicalPost(input: {
  postId: string
  updateData: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_posts")
    .update(input.updateData)
    .eq("post_id", input.postId)

  if (error) {
    throw error
  }
}

export async function publishDueCanonicalScheduledPosts(
  now: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_posts")
    .update({
      lifecycle_state: "published",
      visibility_state: "published",
      updated_at: now,
    })
    .eq("visibility_state", "draft")
    .eq("moderation_state", "approved")
    .eq("visibility", "public")
    .not("published_at", "is", null)
    .lte("published_at", now)
    .is("deleted_at", null)

  if (error) {
    throw error
  }
}