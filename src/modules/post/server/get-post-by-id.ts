import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { PostBlock } from "../types"
import { getPostBlocks } from "@/modules/post/server/get-post-blocks"
import { hasPurchasedPost } from "@/modules/payment/server/has-purchased-post"
import { getPostAccess } from "./get-post-access"
import { getPostMedia } from "./get-post-media"
import { isPublicCreatorProfileVisible } from "@/modules/creator/lib/is-public-creator-profile-visible"
import { getPostPublicState } from "@/modules/post/lib/get-post-public-state"
import { buildPostRenderInput } from "./build-post-render-input"

type PostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | "needs_review" | null
  created_at: string
  published_at: string | null
  deleted_at?: string | null
}

type CreatorRow = {
  id: string
  user_id: string
  username: string
  display_name: string | null
  status: "active" | "pending" | "suspended" | "inactive"
  profiles: {
    id: string
    is_deactivated: boolean | null
    is_delete_pending: boolean | null
    deleted_at: string | null
    is_banned: boolean | null
  } | null
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
  status: "draft" | "scheduled" | "published" | "archived"
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
      "id, creator_id, title, content, visibility, price, status, visibility_status, moderation_status, created_at, published_at, deleted_at"
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
    .select(`
      id,
      user_id,
      username,
      display_name,
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

  if (!creator) {
    throw new Error("Creator not found")
  }

  const isOwner =
    resolvedViewerUserId !== null &&
    creator.user_id === resolvedViewerUserId

  const publicState = getPostPublicState({
    status: post.status,
    visibility: post.visibility,
    visibilityStatus: post.visibility_status,
    moderationStatus: post.moderation_status,
    publishedAt: post.published_at,
    deletedAt: post.deleted_at ?? null,
    now: new Date().toISOString(),
  })

  if (!isOwner) {
    const isVisibleCreator = isPublicCreatorProfileVisible({
      creator: {
        status: creator.status,
      },
      profile: creator.profiles
        ? {
            isDeactivated: creator.profiles.is_deactivated,
            isDeletePending: creator.profiles.is_delete_pending,
            deletedAt: creator.profiles.deleted_at,
            isBanned: creator.profiles.is_banned,
          }
        : null,
    })

    if (!isVisibleCreator) {
      return null
    }

    if (publicState !== "published") {
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

  const [media, rawBlocks] = access.canView
    ? await Promise.all([getPostMedia(post.id), getPostBlocks(post.id)])
    : [[], []]

  const renderInput = buildPostRenderInput({
    content: access.canView ? post.content : null,
    blocks: access.canView ? rawBlocks : [],
    mediaItems: media.map((item) => ({
      id: item.id,
      url: item.url,
      type: item.type,
      mimeType: item.mimeType,
      sortOrder: item.sortOrder,
    })),
  })

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
    content: access.canView ? renderInput.content : null,
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
    blocks: access.canView ? renderInput.blocks : [],
  }
}