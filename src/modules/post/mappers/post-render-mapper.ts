import type { PostBlock } from "@/modules/post/types"

type LockedPreviewRenderableBlockLike = {
  id: string
  postId: string
  type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  mediaId: string | null
  sortOrder: number
  createdAt: string
  editorState: PostBlock["editorState"]
}

export function sortPostRenderableBlocks(
  blocks: LockedPreviewRenderableBlockLike[]
): LockedPreviewRenderableBlockLike[] {
  return [...blocks].sort((a, b) => a.sortOrder - b.sortOrder)
}

export function mapPostBlocksToRenderableBlocks(
  blocks: PostBlock[]
): LockedPreviewRenderableBlockLike[] {
  return sortPostRenderableBlocks(
    blocks.map((block): LockedPreviewRenderableBlockLike => ({
      id: block.id,
      postId: block.postId,
      type: block.type === "carousel" ? "text" : block.type,
      content: block.content,
      mediaId: block.mediaId,
      sortOrder: block.sortOrder,
      createdAt: block.createdAt,
      editorState: block.editorState ?? null,
    }))
  )
}

export function selectPostRenderableBlocks(params: {
  canView: boolean
  sortedBlocks: LockedPreviewRenderableBlockLike[]
  previewBlocks: LockedPreviewRenderableBlockLike[]
}): LockedPreviewRenderableBlockLike[] {
  return params.canView ? params.sortedBlocks : params.previewBlocks
}