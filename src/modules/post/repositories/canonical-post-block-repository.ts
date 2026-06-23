import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { PostBlockEditorState } from "@/modules/post/types"

export type CanonicalPostBlockRow = {
  block_id: string
  post_id: string
  block_type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  media_id: string | null
  sort_order: number
  editor_state: PostBlockEditorState | null
  created_at: string
}

export async function findCanonicalPostBlocksByPostId(
  postId: string
): Promise<CanonicalPostBlockRow[]> {
  const { data: blocks, error: blocksError } = await supabaseAdmin
    .from("canonical_post_blocks")
    .select(
      "block_id, post_id, block_type, content, sort_order, editor_state, created_at"
    )
    .eq("post_id", postId)
    .order("sort_order", { ascending: true })
    .returns<Array<Omit<CanonicalPostBlockRow, "media_id">>>()

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
    .returns<Array<{ block_id: string; media_id: string }>>()

  if (bindingsError) {
    throw bindingsError
  }

  const mediaIdByBlockId = new Map(
    (bindings ?? []).map((binding) => [binding.block_id, binding.media_id])
  )

  return (blocks ?? []).map((block) => ({
    ...block,
    media_id: mediaIdByBlockId.get(block.block_id) ?? null,
  }))
}

export type CanonicalPostBlockInput = {
  post_id: string
  type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  media_id: string | null
  sort_order: number
  editor_state: PostBlockEditorState | null
}

export async function replaceCanonicalPostBlocks(input: {
  postId: string
  blocks: CanonicalPostBlockInput[]
}): Promise<void> {
  const { error: deleteBindingsError } = await supabaseAdmin
    .from("canonical_post_media_bindings")
    .delete()
    .eq("post_id", input.postId)

  if (deleteBindingsError) {
    throw deleteBindingsError
  }

  const { error: deleteBlocksError } = await supabaseAdmin
    .from("canonical_post_blocks")
    .delete()
    .eq("post_id", input.postId)

  if (deleteBlocksError) {
    throw deleteBlocksError
  }

  if (input.blocks.length === 0) {
    return
  }

  const blockRows = input.blocks.map((block) => ({
    post_id: block.post_id,
    block_type: block.type,
    content: block.content,
    sort_order: block.sort_order,
    editor_state: block.editor_state,
  }))

  const { data: insertedBlocks, error: insertBlocksError } = await supabaseAdmin
    .from("canonical_post_blocks")
    .insert(blockRows)
    .select("block_id, post_id, sort_order")
    .returns<
      Array<{
        block_id: string
        post_id: string
        sort_order: number
      }>
    >()

  if (insertBlocksError) {
    throw insertBlocksError
  }

  const insertedBlockBySortOrder = new Map(
    (insertedBlocks ?? []).map((block) => [
      `${block.post_id}:${block.sort_order}`,
      block,
    ])
  )

  const bindings = input.blocks
    .map((block) => {
      const insertedBlock = insertedBlockBySortOrder.get(
        `${block.post_id}:${block.sort_order}`
      )

      if (!block.media_id || !insertedBlock) {
        return null
      }

      return {
        post_id: block.post_id,
        block_id: insertedBlock.block_id,
        media_id: block.media_id,
        binding_role: "block_media",
        sort_order: block.sort_order,
      }
    })
    .filter(
      (
        binding
      ): binding is {
        post_id: string
        block_id: string
        media_id: string
        binding_role: string
        sort_order: number
      } => binding != null
    )

  if (bindings.length === 0) {
    return
  }

  const { error: insertBindingsError } = await supabaseAdmin
    .from("canonical_post_media_bindings")
    .insert(bindings)

  if (insertBindingsError) {
    throw insertBindingsError
  }
}