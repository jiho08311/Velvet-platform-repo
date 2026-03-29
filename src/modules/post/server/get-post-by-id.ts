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
  creatorUserId: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  priceCents: number | null
  status: "draft" | "published" | "archived"
  createdAt: string
  publishedAt: string | null
  isLocked: boolean
  lockReason: "none" | "subscription" | "purchase"
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
  viewerUserId?: string | null
): Promise<PostDetail | null> {
  const resolvedPostId = postId.trim()
  const resolvedViewerUserId =
    typeof viewerUserId === "string" && viewerUserId.trim().length > 0
      ? viewerUserId.trim()
      : null

  if (!resolvedPostId) {
    throw new Error("postId is required")
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

  let isSubscribed = false
  let hasPurchasedResult = false

  if (resolvedViewerUserId) {
    const { data: subscriptionRow, error: subscriptionError } =
      await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("user_id", resolvedViewerUserId)
        .eq("creator_id", post.creator_id)
        .eq("status", "active")
        .maybeSingle<SubscriptionRow>()

    if (subscriptionError) {
      throw subscriptionError
    }

    isSubscribed = Boolean(subscriptionRow)

    if (post.visibility === "paid" && (post.price_cents ?? 0) > 0) {
      hasPurchasedResult = await hasPurchasedPost({
        userId: resolvedViewerUserId,
        postId: post.id,
      })
    }
  }

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
    isSubscribedResult: isSubscribed,
    hasPurchasedResult,
  })

  const media = access.canView ? await getPostMedia(post.id) : []

  const lockReason: "none" | "subscription" | "purchase" = access.canView
    ? "none"
    : post.visibility === "paid"
      ? "purchase"
      : post.visibility === "subscribers"
        ? "subscription"
        : "none"

  return {
    id: post.id,
    creatorId: post.creator_id,
    creatorUserId: creator.user_id,
    title: post.title,
    content: access.canView ? post.content : null,
    visibility: post.visibility,
    priceCents: post.price_cents,
    status: post.status,
    createdAt: post.created_at,
    publishedAt: post.published_at,
    isLocked: !access.canView,
    lockReason,
    media,
  }
}