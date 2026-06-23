import { buildPostRenderInput } from "@/modules/post/mappers/post-render-input"
import {
  findCreatorStudioPostRowsByCreatorId,
} from "@/modules/post/repositories/post-repository"
import { readPostBlockAuthority } from "@/modules/post/repositories/post-block-read-authority-repository"




import type { PostBlockEditorState } from "../types"

export type CreatorStudioPost = {
  id: string
  creatorId: string
  title: string | null
  content: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

type ListCreatorStudioPostsParams = {
  creatorId: string
}

export async function listCreatorStudioPosts({
  creatorId,
}: ListCreatorStudioPostsParams): Promise<CreatorStudioPost[]> {
  const posts = await findCreatorStudioPostRowsByCreatorId(creatorId)

  if (posts.length === 0) {
    return []
  }

  const postIds = posts.map((post) => post.id)
const blockRows = (
  await Promise.all(
    postIds.map((postId) =>
readPostBlockAuthority(postId)
    )
  )
).flat()

const blocksMap = new Map<string, typeof blockRows>()

  for (const block of blockRows) {
    const current = blocksMap.get(block.post_id) ?? []
    current.push(block)
    blocksMap.set(block.post_id, current)
  }

  return posts.map((post) => {
    const renderInput = buildPostRenderInput({
      text: post.content ?? "",
      blocks: (blocksMap.get(post.id) ?? []).map((block) => ({
        id: block.id,
        postId: block.post_id,
     type: block.type as
  | "text"
  | "image"
  | "video"
  | "audio"
  | "file",
        content: block.content,
        mediaId: block.media_id,
        sortOrder: block.sort_order,
        createdAt: block.created_at,
        editorState: (block.editor_state as PostBlockEditorState) ?? null,
      })),
      media: [],
    })

    return {
      id: post.id,
      creatorId: post.creator_id,
      title: post.title,
      content: renderInput.blockText || null,
      status: post.status,
      visibility: post.visibility,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      deletedAt: post.deleted_at,
    }
  })
}