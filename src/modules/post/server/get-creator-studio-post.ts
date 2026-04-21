import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { getPostBlocks } from "@/modules/post/server/get-post-blocks"
import { buildPostRenderInput } from "@/modules/post/ui/post-render-input"
import type { EditPostDraftBlock } from "@/modules/post/server/edit-post-draft-policy"

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
  blocks: EditPostDraftBlock[]
}

type GetCreatorStudioPostParams = {
  postId: string
  creatorId: string
}

type PostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  price: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type MediaRow = {
  id: string
  post_id: string
  storage_path: string
  type: "image" | "video" | "audio" | "file"
  mime_type: string | null
  status: "processing" | "ready" | "failed"
  sort_order: number
}


function isEditableRawBlockType(
  value: string
): value is "text" | "image" | "video" | "audio" | "file" {
  return (
    value === "text" ||
    value === "image" ||
    value === "video" ||
    value === "audio" ||
    value === "file"
  )
}

function buildEditDraftBlocksFromRawBlocks(params: {
  blocks: {
    id: string
    postId: string
    type: string
    content: string | null
    mediaId: string | null
    sortOrder: number
    createdAt: string
    editorState?: unknown | null
  }[]
}): EditPostDraftBlock[] {
  const sortedBlocks = [...params.blocks].sort((a, b) => a.sortOrder - b.sortOrder)

  const result: EditPostDraftBlock[] = []

  for (const block of sortedBlocks) {
    if (!isEditableRawBlockType(block.type)) {
      continue
    }

    if (block.type === "text") {
      result.push({
        type: "text",
        content: block.content ?? "",
        sortOrder: block.sortOrder,
        editorState: (block.editorState as any) ?? null,
      })
      continue
    }

    if (!block.mediaId) {
      continue
    }

    result.push({
      type: block.type,
      sortOrder: block.sortOrder,
      media: {
        kind: "existing",
        mediaId: block.mediaId,
      },
      editorState: (block.editorState as any) ?? null,
      content: null,
    })
  }

  return result
}

  

export async function getCreatorStudioPost({
  postId,
  creatorId,
}: GetCreatorStudioPostParams): Promise<CreatorStudioPostDetail | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, creator_id, title, content, status, visibility, price, created_at, updated_at, deleted_at"
    )
    .eq("id", postId)
    .eq("creator_id", creatorId)
    .in("status", ["draft", "scheduled", "published", "archived"])
    .is("deleted_at", null)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  const post = data as PostRow

  const { data: mediaRows, error: mediaError } = await supabaseAdmin
    .from("media")
    .select("id, post_id, storage_path, type, mime_type, status, sort_order")
    .eq("post_id", post.id)
    .eq("status", "ready")
    .order("sort_order", { ascending: true })
    .returns<MediaRow[]>()

  if (mediaError) {
    throw mediaError
  }

  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

  const media = await Promise.all(
    (mediaRows ?? []).map(async (item) => {
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(item.storage_path, 60 * 60)

      return {
        id: item.id,
        url: signedUrlData?.signedUrl ?? "",
        type: item.type,
      }
    })
  )

  const rawBlocks = await getPostBlocks(post.id)

  const renderInput = buildPostRenderInput({
    text: post.content ?? "",
    blocks: rawBlocks,
    media: (mediaRows ?? []).map((item, index) => ({
      id: item.id,
      url: media[index]?.url ?? "",
      type: item.type,
      mimeType: item.mime_type,
      sortOrder: item.sort_order,
    })),
  })

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
    blocks: buildEditDraftBlocksFromRawBlocks({
      blocks: rawBlocks.map((block) => ({
        id: block.id,
        postId: block.postId,
        type: block.type,
        content: block.content,
        mediaId: block.mediaId,
        sortOrder: block.sortOrder,
        createdAt: block.createdAt,
        editorState: block.editorState ?? null,
      })),
    }),
  }
}