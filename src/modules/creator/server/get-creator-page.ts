import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { canViewPost } from "@/modules/post/server/can-view-post"
import { checkSubscription } from "@/modules/subscription/server/check-subscription"

type GetCreatorPageInput = {
  username: string
  viewerUserId?: string | null
}

type ProfileRow = {
  id: string
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
.select("id, user_id, username, display_name")
.ilike("username", normalized)
.eq("status", "active")
    .maybeSingle()

  if (!creator) return null

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, avatar_url, bio, is_deactivated, is_delete_pending, deleted_at, is_banned")
    .eq("id", creator.user_id)
    .maybeSingle<ProfileRow>()

if (
  !profile ||
  profile.is_deactivated ||
  profile.is_delete_pending ||
  profile.deleted_at ||
  profile.is_banned
) {
  return null
}
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
      "id, creator_id, content, visibility, price, status, created_at, published_at, visibility_status, moderation_status"
    )
    .eq("creator_id", creator.id)
 .or(
    `and(status.eq.published,visibility_status.eq.published,moderation_status.eq.approved),and(status.eq.scheduled,visibility.eq.public,moderation_status.eq.approved,published_at.gt.${now})`
  )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .returns<PostRow[]>()

  if (postsError) {
    throw postsError
  }

  const postList = posts ?? []
  const postIds = postList.map((post) => post.id)

  const { data: likeRows } = await supabaseAdmin
    .from("post_likes")
    .select("post_id")
    .in("post_id", postIds)

  const likeCountMap = new Map<string, number>()

  for (const row of (likeRows ?? []) as PostLikeRow[]) {
    likeCountMap.set(
      row.post_id,
      (likeCountMap.get(row.post_id) ?? 0) + 1
    )
  }

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
    .select("post_id, storage_path, type, mime_type, status, sort_order")
    .in("post_id", publishedPostIds.length > 0 ? publishedPostIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("status", "ready")
    .order("sort_order", { ascending: true })

  const mediaMap = new Map<string, any[]>()

  for (const media of mediaRows ?? []) {
    const current = mediaMap.get(media.post_id) ?? []
    current.push(media)
    mediaMap.set(media.post_id, current)
  }

  const items = await Promise.all(
    postList.map(async (post) => {
      const isScheduled = post.status === "scheduled"

      if (isScheduled) {
        return {
          id: post.id,
          text: post.content ?? "",
          isLocked: false,
          price: post.price,
          media: [],
          createdAt: post.created_at,
          publishedAt: post.published_at,
          status: post.status,
          likesCount: 0,
          isLiked: false,
          commentsCount: 0,
          creatorId: creator.id,
          creatorUserId: creator.user_id,
          currentUserId: viewerUserId ?? null,
          creator: {
            username: creator.username,
            displayName: profile.display_name ?? creator.username,
            avatarUrl: profile.avatar_url ?? null,
          },
        }
      }

      const hasPurchased = purchasedSet.has(post.id)

      const hasAccess = canViewPost({
        viewerUserId: viewerUserId ?? "",
        creatorId: creator.user_id,
        visibility: post.visibility,
        isSubscribed,
        hasPurchased,
      })

   const allMediaRows = mediaMap.get(post.id) ?? []

const previewMediaRows = hasAccess
  ? allMediaRows
  : allMediaRows.slice(0, 1)

const media = await Promise.all(
  previewMediaRows.map(async (item) => ({
   url: await createMediaSignedUrl({
  storagePath: item.storage_path,
  viewerUserId: viewerUserId ?? "",
  creatorUserId: creator.user_id,
  visibility: post.visibility,
  hasPurchased,
  allowPreview: !hasAccess,
}),
    type: item.type ?? "image",
  }))
)

      return {
        id: post.id,
        text: hasAccess ? post.content ?? "" : "",
        isLocked: !hasAccess,
        price: post.price,
        media,
        createdAt: post.published_at ?? post.created_at,
        publishedAt: post.published_at,
        status: post.status,
        likesCount: likeCountMap.get(post.id) ?? 0,
        isLiked: myLikeSet.has(post.id),
        commentsCount: commentCountMap.get(post.id) ?? 0,
        creatorId: creator.id,
        creatorUserId: creator.user_id,
        currentUserId: viewerUserId ?? null,
        creator: {
          username: creator.username,
          displayName: profile.display_name ?? creator.username,
          avatarUrl: profile.avatar_url ?? null,
        },
      }
    })
  )

  return {
    creator: {
      id: creator.id,
      userId: creator.user_id,
      username: creator.username,
      displayName: profile.display_name ?? creator.username,
      avatarUrl: profile.avatar_url ?? null,
      bio: profile.bio ?? "",
      isSubscribed,
    },
    posts: items,
  }
}