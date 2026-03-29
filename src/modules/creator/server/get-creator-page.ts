import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { canViewPost } from "@/modules/post/server/can-view-post"
import { checkSubscription } from "@/modules/subscription/server/check-subscription"

type GetCreatorPageInput = {
  username: string
  viewerUserId?: string | null
}

export async function getCreatorPage({
  username,
  viewerUserId,
}: GetCreatorPageInput) {
  const normalized = username.trim().toLowerCase()

  if (!normalized) {
    throw new Error("username is required")
  }

  // 1. creator 조회
  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("id, user_id, username, display_name")
    .ilike("username", normalized)
    .maybeSingle()

  if (!creator) return null

  // 2. subscription 체크
  let isSubscribed = false

  if (viewerUserId) {
    isSubscribed = await checkSubscription({
      userId: viewerUserId,
      creatorId: creator.id,
    })
  }

  // 3. posts 조회
  const { data: posts } = await supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, content, visibility, price_cents, created_at, published_at"
    )
    .eq("creator_id", creator.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })

  const postList = posts ?? []
  const postIds = postList.map((p) => p.id)

  // 4. payments (한번에)
  let purchasedSet = new Set<string>()

  if (viewerUserId && postIds.length > 0) {
    const { data: payments } = await supabaseAdmin
      .from("payments")
      .select("target_id")
      .eq("user_id", viewerUserId)
      .eq("target_type", "post")
      .eq("status", "succeeded")
      .in("target_id", postIds)

    purchasedSet = new Set(
      (payments ?? []).map((p) => p.target_id)
    )
  }

  // 5. media 조회
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

  // 6. 결과 구성
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
        (hasAccess ? mediaMap.get(post.id) ?? [] : []).map(async (m) => ({
          url: await createMediaSignedUrl({
            storagePath: m.storage_path,
            viewerUserId: viewerUserId ?? "",
            creatorUserId: creator.user_id,
            visibility: post.visibility,
            hasPurchased,
          }),
          type: m.type ?? "image",
        }))
      )

      return {
        id: post.id,
        text: hasAccess ? post.content ?? "" : "",
        isLocked: !hasAccess,
        price: post.price_cents,
        media,
        createdAt: post.published_at ?? post.created_at,
      }
    })
  )

  return {
    creator: {
      id: creator.id,
      userId: creator.user_id,
      username: creator.username,
      displayName: creator.display_name,
      isSubscribed,
    },
    posts: items,
  }
}