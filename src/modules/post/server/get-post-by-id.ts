import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { PostBlock } from "../types"
import { getPostBlocks } from "./get-post-blocks"
import { hasPurchasedPost } from "@/modules/payment/server/has-purchased-post"
import { getPostAccess } from "./get-post-access"
import { getPostMedia } from "./get-post-media"

type PostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number | null
  status: "draft" | "published" | "archived"
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | null
  created_at: string
  published_at: string | null
}

type CreatorRow = {
  id: string
  user_id: string
  username: string
  display_name: string | null
}

type SubscriptionRow = {
  id: string
}

export type PostDetail = {
  id: string
  creatorId: string
  creatorUserId: string
  creator: {
    username: string
    displayName: string | null
  }
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number | null
  status: "draft" | "published" | "archived"
  createdAt: string
  publishedAt: string | null
  isLocked: boolean
  lockReason: "none" | "subscription" | "purchase"
  likesCount: number
  commentsCount: number
  media: {
    id: string
    postId: string
    type: "image" | "video" | "audio" | "file"
    url: string
    mimeType: string | null
    sortOrder: number
  }[]
  blocks?: PostBlock[]
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
      "id, creator_id, title, content, visibility, price, status, visibility_status, moderation_status, created_at, published_at"
    )
    .eq("id", resolvedPostId)
    .is("deleted_at", null)
    .maybeSingle<PostRow>()

  if (postError) {
    throw postError
  }

  if (!post) {
    return null
  }

  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("id, user_id, username, display_name")
    .eq("id", post.creator_id)
    .maybeSingle<CreatorRow>()

  if (creatorError) {
    throw creatorError
  }

  if (!creator) {
    throw new Error("Creator not found")
  }

  const isOwner =
    resolvedViewerUserId !== null &&
    creator.user_id === resolvedViewerUserId

  if (!isOwner) {
    const isPubliclyAvailable =
      post.status === "published" &&
      post.visibility_status === "published" &&
      post.moderation_status === "approved"

    if (!isPubliclyAvailable) {
      return null
    }
  }

  const [{ count: likesCount }, { count: commentsCount }] = await Promise.all([
    supabaseAdmin
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id),
    supabaseAdmin
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id)
      .is("deleted_at", null),
  ])

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

    if (post.visibility === "paid" && (post.price ?? 0) > 0) {
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
      price: post.price ?? 0,
      createdAt: post.created_at,
    },
    creator: {
      userId: creator.user_id,
    },
    isSubscribedResult: isSubscribed,
    hasPurchasedResult,
  })

  const [media, blocks] = access.canView
    ? await Promise.all([getPostMedia(post.id), getPostBlocks(post.id)])
    : [[], []]

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
    creator: {
      username: creator.username,
      displayName: creator.display_name,
    },
    title: post.title,
    content: access.canView ? post.content : null,
    visibility: post.visibility,
    price: post.price,
    status: post.status,
    createdAt: post.created_at,
    publishedAt: post.published_at,
    isLocked: !access.canView,
    lockReason,
    likesCount: likesCount ?? 0,
    commentsCount: commentsCount ?? 0,
    media,
    blocks,
  }
}