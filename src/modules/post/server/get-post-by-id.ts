import { supabaseAdmin } from "@/infrastructure/supabase/admin"

import { hasPurchasedPost } from "@/modules/payment/server/has-purchased-post"
import { getPostAccess } from "./get-post-access"
import { getPostMedia } from "./get-post-media"

type PostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price_cents: number | null
  status: "draft" | "published" | "archived"
  created_at: string
  published_at: string | null
}

type CreatorRow = {
  id: string
  user_id: string
}

type SubscriptionRow = {
  id: string
}

export type PostDetail = {
  id: string
  creatorId: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  priceCents: number | null
  status: "draft" | "published" | "archived"
  createdAt: string
  publishedAt: string | null
  media: {
    id: string
    postId: string
    type: "image" | "video" | "audio" | "file"
    url: string
    mimeType: string | null
    sortOrder: number
  }[]
}

export async function getPostById(
  postId: string,
  viewerUserId: string
): Promise<PostDetail | null> {
  const resolvedPostId = postId.trim()
  const resolvedViewerUserId = viewerUserId.trim()

  if (!resolvedPostId) {
    throw new Error("postId is required")
  }

  if (!resolvedViewerUserId) {
    throw new Error("viewerUserId is required")
  }

  const { data: post, error: postError } = await supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, title, content, visibility, price_cents, status, created_at, published_at"
    )
    .eq("id", resolvedPostId)
    .maybeSingle<PostRow>()

  if (postError) {
    throw postError
  }

  if (!post) {
    return null
  }

  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("id, user_id")
    .eq("id", post.creator_id)
    .maybeSingle<CreatorRow>()

  if (creatorError) {
    throw creatorError
  }

  if (!creator) {
    throw new Error("Creator not found")
  }

  const { data: subscriptionRow, error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", resolvedViewerUserId)
    .eq("creator_id", post.creator_id)
    .eq("status", "active")
    .maybeSingle<SubscriptionRow>()

  if (subscriptionError) {
    throw subscriptionError
  }

  const hasPurchasedResult =
    post.visibility === "paid" && (post.price_cents ?? 0) > 0
      ? await hasPurchasedPost({
          userId: resolvedViewerUserId,
          postId: post.id,
        })
      : false

  const access = await getPostAccess({
    viewerUserId: resolvedViewerUserId,
    post: {
      id: post.id,
      creatorId: post.creator_id,
      content: post.content ?? undefined,
      visibility: post.visibility,
      priceCents: post.price_cents ?? 0,
      createdAt: post.created_at,
    },
    creator: {
      userId: creator.user_id,
    },
    isSubscribedResult: Boolean(subscriptionRow),
    hasPurchasedResult,
  })

  if (!access.canView) {
    throw new Error("POST_ACCESS_DENIED")
  }

  const media = await getPostMedia(post.id)

  return {
    id: post.id,
    creatorId: post.creator_id,
    title: post.title,
    content: post.content,
    visibility: post.visibility,
    priceCents: post.price_cents,
    status: post.status,
    createdAt: post.created_at,
    publishedAt: post.published_at,
    media,
  }
}