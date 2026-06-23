import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { PostBlockEditorState } from "../types"

export type PostBlockRow = {
  id: string
  post_id: string
  type: string
  content: string | null
  media_id: string | null
  sort_order: number
  created_at: string
  editor_state: unknown | null
}

export type CreatorStudioPostBlockRow = {
  id: string
  post_id: string
  type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  media_id: string | null
  sort_order: number
  created_at: string
  editor_state: unknown | null
}

export type ListCreatorPostBlockRow = {
  id: string
  post_id: string
  type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  media_id: string | null
  sort_order: number
  created_at: string
  editor_state: PostBlockEditorState | null
}

type CanonicalPostBlockRow = {
  block_id: string
  post_id: string
  block_type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  sort_order: number
  created_at: string
  editor_state: PostBlockEditorState | null
}

type CanonicalPostMediaBindingRow = {
  block_id: string
  media_id: string
}

async function listCanonicalPostBlocksByPostIds(
  postIds: string[],
): Promise<ListCreatorPostBlockRow[]> {
  if (postIds.length === 0) {
    return []
  }

  const { data: blocks, error: blocksError } = await supabaseAdmin
    .from("canonical_post_blocks")
    .select(
      "block_id, post_id, block_type, content, sort_order, created_at, editor_state",
    )
    .in("post_id", postIds)
    .order("sort_order", { ascending: true })
    .returns<CanonicalPostBlockRow[]>()

  if (blocksError) {
    throw blocksError
  }

  const blockIds = (blocks ?? []).map((block) => block.block_id)

  if (blockIds.length === 0) {
    return []
  }

  const { data: bindings, error: bindingsError } = await supabaseAdmin
    .from("canonical_post_media_bindings")
    .select("block_id, media_id")
    .in("block_id", blockIds)
    .returns<CanonicalPostMediaBindingRow[]>()

  if (bindingsError) {
    throw bindingsError
  }

  const mediaIdByBlockId = new Map(
    (bindings ?? []).map((binding) => [binding.block_id, binding.media_id]),
  )

  return (blocks ?? []).map((block) => ({
    id: block.block_id,
    post_id: block.post_id,
    type: block.block_type,
    content: block.content,
    media_id: mediaIdByBlockId.get(block.block_id) ?? null,
    sort_order: block.sort_order,
    created_at: block.created_at,
    editor_state: block.editor_state,
  }))
}

export async function findPostBlocksByPostIds(
  postIds: string[],
): Promise<CreatorStudioPostBlockRow[]> {
  const rows = await listCanonicalPostBlocksByPostIds(postIds)

  return rows.map((row) => ({
    ...row,
    editor_state: row.editor_state,
  }))
}

export async function findListCreatorPostBlocksByPostIds(
  postIds: string[],
): Promise<ListCreatorPostBlockRow[]> {
  return listCanonicalPostBlocksByPostIds(postIds)
}

export async function findPostBlocksByPostId(
  postId: string,
): Promise<PostBlockRow[]> {
  const rows = await listCanonicalPostBlocksByPostIds([postId])

  return rows.map((row) => ({
    id: row.id,
    post_id: row.post_id,
    type: row.type,
    content: row.content,
    media_id: row.media_id,
    sort_order: row.sort_order,
    created_at: row.created_at,
    editor_state: row.editor_state,
  }))
}