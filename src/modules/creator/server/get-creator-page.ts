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
    .maybeSingle()

  if (!creator) return null

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, avatar_url, bio, is_deactivated")
    .eq("id", creator.user_id)
    .maybeSingle<ProfileRow>()

  if (!profile || profile.is_deactivated) {
    return null
  }

  let isSubscribed = false

  if (viewerUserId) {
    isSubscribed = await checkSubscription({
      userId: viewerUserId,
      creatorId: creator.id,
    })
  }

  const { data: posts } = await supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, content, visibility, price_cents, created_at, published_at"
    )
    .eq("creator_id", creator.id)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })

  const postList = posts ?? []
  const postIds = postList.map((post) => post.id)

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

  const { data: mediaRows } = await supabaseAdmin
    .from("media")
    .select("post_id, storage_path, type, mime_type, status, sort_order")
    .in("post_id", postIds)
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
      const hasPurchased = purchasedSet.has(post.id)

      const hasAccess = canViewPost({
        viewerUserId: viewerUserId ?? "",
        creatorId: creator.user_id,
        visibility: post.visibility,
        isSubscribed,
        hasPurchased,
      })

      const media = await Promise.all(
        (hasAccess ? mediaMap.get(post.id) ?? [] : []).map(async (item) => ({
          url: await createMediaSignedUrl({
            storagePath: item.storage_path,
            viewerUserId: viewerUserId ?? "",
            creatorUserId: creator.user_id,
            visibility: post.visibility,
            hasPurchased,
          }),
          type: item.type ?? "image",
        }))
      )

      return {
        id: post.id,
        text: hasAccess ? post.content ?? "" : "",
        isLocked: !hasAccess,
        price: post.price_cents,
        media,
        createdAt: post.published_at ?? post.created_at,

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