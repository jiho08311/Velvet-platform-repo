import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { hasPurchasedPost } from "@/modules/payment/server/has-purchased-post"
import { checkSubscription } from "@/modules/subscription/server/check-subscription"

export type PostMediaItem = {
  id: string
  postId: string
  type: "image" | "video" | "audio" | "file"
  url: string
  mimeType: string | null
  sortOrder: number
}

type MediaRow = {
  id: string
  post_id: string
  type: "image" | "video" | "audio" | "file"
  storage_path: string
  mime_type: string | null
  sort_order: number
  status: "processing" | "ready" | "failed"
}

type PostAccessRow = {
  id: string
  creator_id: string
  visibility: "public" | "subscribers" | "paid"
  price_cents: number
}

type CreatorRow = {
  id: string
  user_id: string
}

export async function getPostMedia(postId: string): Promise<PostMediaItem[]> {
  const resolvedPostId = postId.trim()

  if (!resolvedPostId) {
    throw new Error("postId is required")
  }

  const user = await getCurrentUser()
  const viewerUserId = user?.id ?? null

  const { data: post, error: postError } = await supabaseAdmin
    .from("posts")
    .select("id, creator_id, visibility, price_cents")
    .eq("id", resolvedPostId)
    .maybeSingle<PostAccessRow>()

  if (postError) {
    throw postError
  }

  if (!post) {
    return []
  }

  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("id, user_id")
    .eq("id", post.creator_id)
    .maybeSingle<CreatorRow>()

  if (creatorError) {
    throw creatorError
  }

  const creatorUserId = creator?.user_id ?? null

  const isSubscribed =
    viewerUserId && creatorUserId
      ? await checkSubscription({
          userId: viewerUserId,
          creatorId: post.creator_id,
        })
      : false

  const hasPurchased =
    viewerUserId && post.visibility === "paid" && post.price_cents > 0
      ? await hasPurchasedPost({
          userId: viewerUserId,
          postId: post.id,
        })
      : false

  const { data, error } = await supabaseAdmin
    .from("media")
    .select("id, post_id, type, storage_path, mime_type, sort_order, status")
    .eq("post_id", resolvedPostId)
    .eq("status", "ready")
    .order("sort_order", { ascending: true })
    .returns<MediaRow[]>()

  if (error) {
    throw error
  }

  const rows = data ?? []

  return Promise.all(
    rows.map(async (media) => {
      const url = await createMediaSignedUrl({
        storagePath: media.storage_path,
        viewerUserId,
        creatorUserId,
        visibility: post.visibility,
        isSubscribed,
        hasPurchased,
      })

      return {
        id: media.id,
        postId: media.post_id,
        type: media.type,
        url,
        mimeType: media.mime_type,
        sortOrder: media.sort_order,
      }
    })
  )
}