import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import {
  isEligiblePublicDiscoveryCreator,
  isEligiblePublicDiscoveryPost,
} from "@/modules/post/lib/public-discovery-inclusion"
import { resolvePostAccessState } from "./resolve-post-access-state"

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
  price: number
  status: "draft" | "scheduled" | "published" | "archived"
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | "needs_review" | null
  published_at: string | null
  deleted_at: string | null
}

type CreatorRow = {
  id: string
  user_id: string
  status: "active" | "pending" | "suspended" | "inactive"
  profiles: {
    id: string
    is_deactivated: boolean | null
    is_delete_pending: boolean | null
    deleted_at: string | null
    is_banned: boolean | null
  } | null
}

export async function getPostMedia(postId: string): Promise<PostMediaItem[]> {
  const resolvedPostId = postId.trim()

  if (!resolvedPostId) {
    throw new Error("postId is required")
  }

  const user = await getCurrentUser()
  const viewerUserId = user?.id ?? null
  const now = new Date().toISOString()

  const { data: post, error: postError } = await supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, visibility, price, status, visibility_status, moderation_status, published_at, deleted_at"
    )
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
    .select(`
      id,
      user_id,
      status,
      profiles!inner (
        id,
        is_deactivated,
        is_delete_pending,
        deleted_at,
        is_banned
      )
    `)
    .eq("id", post.creator_id)
    .maybeSingle<CreatorRow>()

  if (creatorError) {
    throw creatorError
  }

  const creatorUserId = creator?.user_id ?? null
  const isOwner =
    viewerUserId !== null &&
    creatorUserId !== null &&
    viewerUserId === creatorUserId

  if (!isOwner) {
    const isVisibleCreator = isEligiblePublicDiscoveryCreator({
      creator: {
        status: creator?.status ?? null,
      },
      profile: creator?.profiles ?? null,
    })

    if (!isVisibleCreator) {
      return []
    }

    if (
      !isEligiblePublicDiscoveryPost({
        post,
        now,
        allowedStates: ["published"],
      })
    ) {
      return []
    }
  }

  const { isSubscribed, hasPurchased } = await resolvePostAccessState({
    viewerUserId,
    creatorId: post.creator_id,
    creatorUserId: creatorUserId ?? "",
    post: {
      id: post.id,
      title: null,
      content: null,
      status: post.status,
      visibility: post.visibility,
      price: post.price,
      publishedAt: post.published_at,
      createdAt: post.published_at ?? now,
      updatedAt: post.published_at ?? now,
    },
  })

  const { data, error } = await supabaseAdmin
    .from("media")
    .select("id, post_id, type, storage_path, mime_type, sort_order, status")
    .eq("post_id", resolvedPostId)
    .in("status", ["processing", "ready"])
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
