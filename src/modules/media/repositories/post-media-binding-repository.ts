// src/modules/media/repositories/post-media-binding-repository.ts

import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type PostMediaBindingRow = {
  binding_id: string
  post_id: string
  block_id: string | null
  media_id: string
  binding_role: string
  sort_order: number
  created_at: string
}

export async function createPostMediaBinding(input: {
  postId: string
  blockId?: string | null
  mediaId: string
  bindingRole: string
  sortOrder: number
}): Promise<PostMediaBindingRow> {
  const { data, error } = await supabaseAdmin
    .from("canonical_post_media_bindings")
 .upsert(
  {
    post_id: input.postId,
    block_id: input.blockId ?? null,
    media_id: input.mediaId,
    binding_role: input.bindingRole,
    sort_order: input.sortOrder,
  },
  { onConflict: "post_id,media_id,binding_role" }
)
    .select("*")
    .single<PostMediaBindingRow>()

  if (error || !data) {
    throw error ?? new Error("Failed to create post media binding")
  }

  return data
}

export async function findPostMediaBindingsByPostIds(
  postIds: string[]
): Promise<PostMediaBindingRow[]> {
  if (postIds.length === 0) {
    return []
  }

  const { data, error } = await supabaseAdmin
    .from("canonical_post_media_bindings")
    .select("*")
    .in("post_id", postIds)
    .order("sort_order")
    .returns<PostMediaBindingRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function deletePostMediaBinding(input: {
  postId: string
  mediaId: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_post_media_bindings")
    .delete()
    .eq("post_id", input.postId)
    .eq("media_id", input.mediaId)

  if (error) {
    throw error
  }
}