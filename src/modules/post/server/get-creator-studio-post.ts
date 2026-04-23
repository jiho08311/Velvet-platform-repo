import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { getPostBlocks } from "@/modules/post/server/get-post-blocks"
import { buildPostEditorDraftFromPostBlocks } from "@/modules/post/server/post-editor-draft-normalizer"
import { buildPostRenderInput } from "@/modules/post/lib/post-render-input"
import type { CreateOrEditPostFormBlock } from "@/modules/post/types"

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
