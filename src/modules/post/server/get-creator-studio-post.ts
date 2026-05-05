import { createMediaSignedUrl } from "@/modules/media/public/create-media-signed-url"
import { buildPostEditorDraftFromPostBlocks } from "@/modules/post/server/post-editor-draft-normalizer"
import { buildPostRenderInput } from "@/modules/post/lib/post-render-input"
import { findCreatorStudioPostById } from "@/modules/post/repositories/post-repository"
import { findReadyPostMediaRowsByPostId } from "@/modules/post/repositories/post-media-repository"
import { findPostBlocksByPostId } from "@/modules/post/repositories/post-block-repository"
import type { CreateOrEditPostFormBlock, PostBlock } from "@/modules/post/types"

export type CreatorStudioPostDetail = {
  id: string
  creatorId: string
  title: string | null
  content: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  price: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  media: {
    id: string
    url: string
    type: "image" | "video" | "audio" | "file"
  }[]
  blocks: CreateOrEditPostFormBlock[]
}

type GetCreatorStudioPostParams = {
  postId: string
  creatorId: string
}

export async function getCreatorStudioPost({
  postId,
  creatorId,
}: GetCreatorStudioPostParams): Promise<CreatorStudioPostDetail | null> {
  const post = await findCreatorStudioPostById({ postId, creatorId })

  if (!post) {
    return null
  }

  const mediaRows = await findReadyPostMediaRowsByPostId(post.id)

  const media = await Promise.all(
    mediaRows.map(async (item) => {
      return {
        id: item.id,
        url: await createMediaSignedUrl({
          storagePath: item.storage_path,
          visibility: post.visibility,
          canView: true,
          expiresIn: 60 * 60,
        }),
        type: item.type,
      }
    })
  )

  const blockRows = await findPostBlocksByPostId(post.id)
  const rawBlocks: PostBlock[] = blockRows.map((row) => ({
    id: row.id,
    postId: row.post_id,
    type: row.type as PostBlock["type"],
    content: row.content,
    mediaId: row.media_id,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    editorState: (row.editor_state as PostBlock["editorState"]) ?? null,
  }))

  const renderInput = buildPostRenderInput({
    text: post.content ?? "",
    blocks: rawBlocks,
    media: mediaRows.map((item, index) => ({
      id: item.id,
      url: media[index]?.url ?? "",
      type: item.type,
      mimeType: item.mime_type,
      sortOrder: item.sort_order,
    })),
  })

  const initialDraftBlocks = buildPostEditorDraftFromPostBlocks(rawBlocks)

  return {
    id: post.id,
    creatorId: post.creator_id,
    title: post.title,
    content: renderInput.blockText || null,
    status: post.status,
    visibility: post.visibility,
    price: post.price ?? 0,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    deletedAt: post.deleted_at,
    media,
    blocks: initialDraftBlocks,
  }
}
