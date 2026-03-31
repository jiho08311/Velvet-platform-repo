import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"

export type MyPostListItem = {
  id: string
  creatorId: string
  text: string
  status: "draft" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  isLocked: boolean
  createdAt: string
  publishedAt: string | null
  media?: {
    url: string
    type?: "image" | "video" | "audio" | "file"
  }[]
}

export type GetMyPostsInput = {
  creatorId: string
  limit?: number
  cursor?: string | null
  status?: "draft" | "published"
}

export type GetMyPostsResult = {
  items: MyPostListItem[]
  nextCursor: string | null
}

type CreatorRow = {
  id: string
  user_id: string
}

type PostRow = {
  id: string
  creator_id: string
  content: string | null
  status: "draft" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  created_at: string
  published_at: string | null
}

type MediaRow = {
  post_id: string
  storage_path: string
  type: "image" | "video" | "audio" | "file" | null
  mime_type: string | null
  sort_order: number
  status: "processing" | "ready" | "failed"
}

function resolveMediaType(row: MediaRow): "image" | "video" | "audio" | "file" {
  if (
    row.type === "image" ||
    row.type === "video" ||
    row.type === "audio" ||
    row.type === "file"
  ) {
    return row.type
  }

  if (typeof row.mime_type === "string") {
    if (row.mime_type.startsWith("image/")) return "image"
    if (row.mime_type.startsWith("video/")) return "video"
    if (row.mime_type.startsWith("audio/")) return "audio"
  }

  return "file"
}

export async function getMyPosts(
  input: GetMyPostsInput
): Promise<GetMyPostsResult> {
  const rawCreatorId = input.creatorId.trim()

  if (!rawCreatorId) {
    throw new Error("Creator id is required")
  }

  const limit = Math.max(1, Math.min(input.limit ?? 20, 100))

  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("id, user_id")
    .or(`id.eq.${rawCreatorId},user_id.eq.${rawCreatorId}`)
    .maybeSingle<CreatorRow>()

  if (creatorError) {
    throw creatorError
  }

  if (!creator) {
    return {
      items: [],
      nextCursor: null,
    }
  }

let postQuery = supabaseAdmin
  .from("posts")
  .select(
    "id, creator_id, content, status, visibility, created_at, published_at"
  )
  .eq("creator_id", creator.id)
  .is("deleted_at", null)

if (input.status) {
  postQuery = postQuery.eq("status", input.status)
}

postQuery = postQuery
  .order("created_at", { ascending: false })
  .limit(limit)

  const { data: posts, error: postsError } = await postQuery

  if (postsError) {
    throw postsError
  }

  const postIds = (posts ?? []).map((post) => post.id)

  if (postIds.length === 0) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const { data: mediaRows, error: mediaError } = await supabaseAdmin
    .from("media")
    .select("post_id, storage_path, type, mime_type, sort_order, status")
    .in("post_id", postIds)
    .eq("status", "ready")
    .order("sort_order", { ascending: true })
    .returns<MediaRow[]>()

  if (mediaError) {
    throw mediaError
  }

  const mediaMap = new Map<string, MediaRow[]>()

  for (const media of mediaRows ?? []) {
    const current = mediaMap.get(media.post_id) ?? []
    current.push(media)
    mediaMap.set(media.post_id, current)
  }

  const items = await Promise.all(
    (posts ?? []).map(async (post) => {
      const previewRows = (mediaMap.get(post.id) ?? []).slice(0, 1)

      const media = await Promise.all(
        previewRows.map(async (item) => {
          const url = await createMediaSignedUrl({
            storagePath: item.storage_path,
            viewerUserId: creator.user_id,
            creatorUserId: creator.user_id,
            visibility: post.visibility,
            isSubscribed: true,
            hasPurchased: true,
          })

          return {
            url,
            type: resolveMediaType(item),
          }
        })
      )

      return {
        id: post.id,
        creatorId: post.creator_id,
        text: post.content ?? "",
        status: post.status,
        visibility: post.visibility,
        isLocked: false,
        createdAt: post.created_at,
        publishedAt: post.published_at,
        media,
      }
    })
  )

  return {
    items,
    nextCursor: null,
  }
}