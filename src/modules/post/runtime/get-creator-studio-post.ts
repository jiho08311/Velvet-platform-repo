import { serveMediaUrl } from "@/modules/media/serving"
import { buildPostEditorDraftFromPostBlocks } from "@/modules/post/mappers/post-editor-draft-normalizer"
import { buildPostRenderInput } from "@/modules/post/mappers/post-render-input"
import { readPostBlockAuthority } from "@/modules/post/repositories/post-block-read-authority-repository"
import { findCreatorStudioPostById } from "@/modules/post/repositories/post-repository"
import { findReadyPostMediaRowsByPostId } from "@/modules/media/public/get-post-media-bindings"
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

function toPostBlocks(
  rows: Awaited<ReturnType<typeof readPostBlockAuthority>>
): PostBlock[] {
  return rows
    .filter((row) =>
      row.type === "text" ||
      row.type === "image" ||
      row.type === "video" ||
      row.type === "audio" ||
      row.type === "file"
    )
    .map((row) => ({
      id: row.id,
      postId: row.post_id,
      type: row.type as PostBlock["type"],
      content: row.content,
      mediaId: row.media_id,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      editorState: (row.editor_state as PostBlock["editorState"]) ?? null,
    }))
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
    mediaRows.map(async (item) => ({
      id: item.id,
      url: await serveMediaUrl({
        storagePath: item.storage_path,
        visibility: post.visibility,
        canView: true,
        expiresIn: 60 * 60,
      }),
      type: item.type,
    }))
  )

const blockRows = await readPostBlockAuthority(post.id)
  const rawBlocks = toPostBlocks(blockRows)

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