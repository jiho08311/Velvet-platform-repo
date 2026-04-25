import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { buildPublicCreatorProfileVisibilityInput } from "@/modules/creator/lib/build-public-creator-profile-visibility-input"
import { buildPostRenderInput } from "@/modules/post/lib/post-render-input"
import {
  filterPublicDiscoveryPostCandidates,
  type PublicDiscoveryPostEligibilityInput,
} from "@/modules/post/lib/public-discovery-inclusion"
import { buildPostRenderReadModel } from "@/modules/post/server/post-render-read-model"
import { checkSubscription } from "@/modules/subscription/server/check-subscription"
import { isPublicCreatorProfileVisible } from "@/modules/creator/lib/is-public-creator-profile-visible"
import { getPostLockedPreviewPresentation } from "@/modules/post/lib/get-post-locked-preview-presentation"
import type { PostBlockEditorState } from "@/modules/post/types"
import { getPostAccess } from "@/modules/post/server/get-post-access"
import {
  buildPostLikeCountMap,
  readPostLikeCount,
} from "@/shared/lib/post-like-count"

import { buildCreatorIdentity } from "./build-creator-identity"

type GetCreatorPageInput = {
  username: string
  viewerUserId?: string | null
}

type ProfileRow = {
  id: string
  username?: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  is_deactivated: boolean
  is_delete_pending: boolean | null
  deleted_at: string | null
  is_banned: boolean
}

type PostLikeRow = {
  post_id: string
}

type CommentRow = {
  post_id: string
}

type PostRow = {
  id: string
  creator_id: string
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number
  status: "published" | "scheduled"
  created_at: string
  published_at: string | null
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | null
  deleted_at: string | null
}

type MediaRow = {
  id: string
  post_id: string
  storage_path: string
  type: "image" | "video" | "audio" | "file" | null
  mime_type: string | null
  status: "ready"
  sort_order: number
}

type PostBlockRow = {
  id: string
  post_id: string
  type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  media_id: string | null
  sort_order: number
  created_at: string
  editor_state: PostBlockEditorState | null
}

function isCreatorPagePaidTeaser(post: PostRow): boolean {
  return (
    post.visibility === "paid" &&
    post.status === "published" &&
    post.visibility_status === "published" &&
    post.moderation_status === "approved" &&
    !post.deleted_at
  )
}

function filterCreatorPageVisiblePosts(
  posts: PostRow[],
  now: string
): PostRow[] {
  const canonicalPosts = filterPublicDiscoveryPostCandidates(
    posts,
    now,
    ["published", "upcoming"] satisfies PublicDiscoveryPostEligibilityInput["allowedStates"]
  ).map(({ post }) => post)

  const canonicalPostIds = new Set(canonicalPosts.map((post) => post.id))

  const paidTeaserPosts = posts.filter(
    (post) => !canonicalPostIds.has(post.id) && isCreatorPagePaidTeaser(post)
  )

  return [...canonicalPosts, ...paidTeaserPosts]
}

export async function getCreatorPage({
  username,
  viewerUserId,
}: GetCreatorPageInput) {
  const normalized = username.trim().toLowerCase()

  if (!normalized) {
    throw new Error("username is required")
  }

  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("id, user_id, username, display_name, status")
    .ilike("username", normalized)
    .maybeSingle()

  if (!creator) return null

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, display_name, avatar_url, bio, is_deactivated, is_delete_pending, deleted_at, is_banned"
    )
    .eq("id", creator.user_id)
    .maybeSingle<ProfileRow>()

  if (
    !isPublicCreatorProfileVisible(
      buildPublicCreatorProfileVisibilityInput({
        creator: {
          status: creator.status,
        },
        profile,
      })
    )
  ) {
    return null
  }

  if (!profile) {
    return null
  }

  const identity = buildCreatorIdentity({
    creator,
    profile,
  })

  let isSubscribed = false

  if (viewerUserId) {
    isSubscribed = await checkSubscription({
      userId: viewerUserId,
      creatorId: creator.id,
    })
  }

  const now = new Date().toISOString()

  const { data: posts, error: postsError } = await supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, content, visibility, price, status, created_at, published_at, visibility_status, moderation_status, deleted_at"
    )
    .eq("creator_id", creator.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .returns<PostRow[]>()

  if (postsError) {
    throw postsError
  }

  const postList = (posts ?? [])
    .filter((post) => !post.deleted_at)

  const visiblePosts = filterCreatorPageVisiblePosts(postList, now)

  const postIds = visiblePosts.map((post) => post.id)

  const { data: likeRows } = await supabaseAdmin
    .from("post_likes")
    .select("post_id")
    .in("post_id", postIds)

  const likeCountMap = buildPostLikeCountMap((likeRows ?? []) as PostLikeRow[])

  let myLikeSet = new Set<string>()

  if (viewerUserId) {
    const { data: myLikeRows } = await supabaseAdmin
      .from("post_likes")
      .select("post_id")
      .eq("user_id", viewerUserId)
      .in("post_id", postIds)

    myLikeSet = new Set(
      ((myLikeRows ?? []) as PostLikeRow[]).map((row) => row.post_id)
    )
  }

  const { data: commentRows } = await supabaseAdmin
    .from("comments")
    .select("post_id")
    .is("deleted_at", null)
    .in("post_id", postIds)

  const commentCountMap = new Map<string, number>()

  for (const row of (commentRows ?? []) as CommentRow[]) {
    commentCountMap.set(
      row.post_id,
      (commentCountMap.get(row.post_id) ?? 0) + 1
    )
  }

  let purchasedSet = new Set<string>()

  if (viewerUserId && postIds.length > 0) {
    const { data: payments } = await supabaseAdmin
      .from("payments")
      .select("target_id")
      .eq("user_id", viewerUserId)
      .eq("target_type", "post")
      .eq("status", "succeeded")
      .in("target_id", postIds)

    purchasedSet = new Set((payments ?? []).map((payment) => payment.target_id))
  }

  const publishedPostIds = postList
    .filter((post) => post.status === "published")
    .map((post) => post.id)

  const { data: mediaRows } = await supabaseAdmin
    .from("media")
    .select("id, post_id, storage_path, type, mime_type, status, sort_order")
    .in(
      "post_id",
      publishedPostIds.length > 0
        ? publishedPostIds
        : ["00000000-0000-0000-0000-000000000000"]
    )
    .eq("status", "ready")
    .order("sort_order", { ascending: true })
    .returns<MediaRow[]>()

  const { data: blockRows, error: blockRowsError } = await supabaseAdmin
    .from("post_blocks")
    .select("id, post_id, type, content, media_id, sort_order, created_at, editor_state")
    .in(
      "post_id",
      postIds.length > 0
        ? postIds
        : ["00000000-0000-0000-0000-000000000000"]
    )
    .order("sort_order", { ascending: true })
    .returns<PostBlockRow[]>()

  if (blockRowsError) {
    throw blockRowsError
  }

  const mediaMap = new Map<string, MediaRow[]>()

  for (const media of mediaRows ?? []) {
    const current = mediaMap.get(media.post_id) ?? []
    current.push(media)
    mediaMap.set(media.post_id, current)
  }

  const blocksMap = new Map<string, PostBlockRow[]>()

  for (const block of blockRows ?? []) {
    const current = blocksMap.get(block.post_id) ?? []
    current.push(block)
    blocksMap.set(block.post_id, current)
  }

  const items = await Promise.all(
    visiblePosts.map(async (post) => {
      const isScheduled = post.status === "scheduled"

      const renderReadModel = buildPostRenderReadModel({
        blockRows: blocksMap.get(post.id) ?? [],
        mediaItems: [],
      })

      const scheduledRenderInput = buildPostRenderInput({
        text: post.content ?? "",
        blocks: renderReadModel.blocks,
        media: renderReadModel.media,
      })

      if (isScheduled) {
        return {
          id: post.id,
          text: scheduledRenderInput.blockText || "",
          isLocked: false,
          lockReason: "none" as const,
          price: post.price,
          media: [],
          blocks: renderReadModel.blocks,
          renderInput: scheduledRenderInput,
          createdAt: post.created_at,
          publishedAt: post.published_at,
          status: post.status,
          visibility: post.visibility,
          likesCount: 0,
          isLiked: false,
          commentsCount: 0,
          creatorId: creator.id,
          creatorUserId: creator.user_id,
          currentUserId: viewerUserId ?? null,
          creator: {
            username: identity.username,
            displayName: identity.displayName,
            avatarUrl: identity.avatarUrl,
          },
        }
      }

      const hasPurchased = purchasedSet.has(post.id)
      const access = await getPostAccess({
        viewerUserId: viewerUserId ?? null,
        post: {
          id: post.id,
          creatorId: post.creator_id,
          content: post.content ?? undefined,
          visibility: post.visibility,
          price: post.price,
          createdAt: post.created_at,
        },
        creator: {
          userId: creator.user_id,
        },
        isSubscribedResult: isSubscribed,
        hasPurchasedResult: hasPurchased,
      })
      const lockedPreviewPresentation = getPostLockedPreviewPresentation(access)

      const allMediaRows = mediaMap.get(post.id) ?? []

      const previewMediaRows = lockedPreviewPresentation.isLockedPreview
        ? allMediaRows.slice(0, 1)
        : allMediaRows

      const media = await Promise.all(
        previewMediaRows.map(async (item) => ({
          id: item.id,
          url: await createMediaSignedUrl({
            storagePath: item.storage_path,
            viewerUserId: viewerUserId ?? "",
            creatorUserId: creator.user_id,
            visibility: post.visibility,
            hasPurchased,
            allowPreview: lockedPreviewPresentation.isLockedPreview,
          }),
          type: item.type ?? "image",
          mimeType: item.mime_type,
          sortOrder: item.sort_order,
        }))
      )

      const publishedRenderReadModel = buildPostRenderReadModel({
        blockRows: blocksMap.get(post.id) ?? [],
        mediaItems: media,
      })

      const renderInput = buildPostRenderInput({
        text: post.content ?? "",
        blocks: publishedRenderReadModel.blocks,
        media: publishedRenderReadModel.media,
      })

      return {
        id: post.id,
        text: access.canView ? (renderInput.blockText || "") : "",
        isLocked: lockedPreviewPresentation.isLockedPreview,
        lockReason: lockedPreviewPresentation.lockReason,
        price: post.price,
        media,
        blocks: access.canView ? publishedRenderReadModel.blocks : [],
        renderInput,
        createdAt: post.published_at ?? post.created_at,
        publishedAt: post.published_at,
        status: post.status,
        visibility: post.visibility,
        likesCount: readPostLikeCount(likeCountMap, post.id),
        isLiked: myLikeSet.has(post.id),
        commentsCount: commentCountMap.get(post.id) ?? 0,
        creatorId: creator.id,
        creatorUserId: creator.user_id,
        currentUserId: viewerUserId ?? null,
        creator: {
          username: identity.username,
          displayName: identity.displayName,
          avatarUrl: identity.avatarUrl,
        },
      }
    })
  )

  return {
    creator: {
      id: identity.id,
      userId: identity.userId,
      username: identity.username,
      displayName: identity.displayName,
      avatarUrl: identity.avatarUrl,
      bio: identity.bio,
      isSubscribed,
    },
    posts: items,
  }
}
