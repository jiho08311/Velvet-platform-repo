import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { canViewPost } from "@/modules/post/server/can-view-post"

type MediaType = "image" | "video" | "audio" | "file"

export type HomeFeedItem = {
  id: string
  creatorId: string
  creatorUserId?: string
  currentUserId?: string
  text: string
  createdAt: string
  isLocked: boolean
  lockReason?: "none" | "subscription" | "purchase"
  priceCents?: number
  media?: Array<{
    url: string
    type: MediaType
  }>
  creator: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

export type GetHomeFeedInput = {
  viewerUserId: string
  limit?: number
  cursor?: string | null
}

export type GetHomeFeedResult = {
  items: HomeFeedItem[]
  nextCursor: string | null
}

type SubscriptionRow = {
  creator_id: string
}

type CreatorRow = {
  id: string
  user_id: string
  username: string
  display_name: string | null
}

type ProfileRow = {
  id: string
  avatar_url: string | null
}

type PostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price_cents: number | null
  created_at: string
  published_at: string | null
}

type MediaRow = {
  post_id: string
  storage_path: string
  type: MediaType | null
  mime_type: string | null
  status: "processing" | "ready" | "failed"
  sort_order: number
}

function resolveMediaType(row: MediaRow): MediaType {
  if (
    row.type === "image" ||
    row.type === "video" ||
    row.type === "audio" ||
    row.type === "file"
  ) {
    return row.type
  }

  if (typeof row.mime_type === "string") {
    if (row.mime_type.startsWith("image/")) return "image"
    if (row.mime_type.startsWith("video/")) return "video"
    if (row.mime_type.startsWith("audio/")) return "audio"
  }

  return "file"
}

export async function getHomeFeed(
  input: GetHomeFeedInput
): Promise<GetHomeFeedResult> {
  const viewerUserId = input.viewerUserId.trim()

  if (!viewerUserId) {
    throw new Error("Viewer user id is required")
  }

  const limit = Math.max(1, Math.min(input.limit ?? 20, 100))

  const { data: subscriptions } = await supabaseAdmin
    .from("subscriptions")
    .select("creator_id")
    .eq("user_id", viewerUserId)
    .eq("status", "active")
    .returns<SubscriptionRow[]>()

  const creatorIds = (subscriptions ?? []).map(
    (subscription) => subscription.creator_id
  )

  if (creatorIds.length === 0) {
    const { data: posts } = await supabaseAdmin
      .from("posts")
      .select(
        "id, creator_id, title, content, visibility, price_cents, created_at, published_at"
      )
      .eq("status", "published")
      .eq("visibility", "public")
      .is("deleted_at", null)
      .order("published_at", { ascending: false })
      .limit(limit)
      .returns<PostRow[]>()

    const postList = posts ?? []
    const fallbackCreatorIds = Array.from(
      new Set(postList.map((post) => post.creator_id))
    )

    if (fallbackCreatorIds.length === 0) {
      return {
        items: [],
        nextCursor: null,
      }
    }

    const { data: creators } = await supabaseAdmin
      .from("creators")
      .select(`
        id,
        user_id,
        username,
        display_name,
        profiles!inner (
          id,
          is_deactivated
        )
      `)
      .in("id", fallbackCreatorIds)
      .eq("status", "active")
      .eq("profiles.is_deactivated", false)
      .returns<CreatorRow[]>()

    const creatorMap = new Map((creators ?? []).map((creator) => [creator.id, creator]))
    const filteredPosts = postList.filter((post) =>
      creatorMap.has(post.creator_id)
    )

    if (filteredPosts.length === 0) {
      return {
        items: [],
        nextCursor: null,
      }
    }

    const creatorUserIds = Array.from(
      new Set((creators ?? []).map((creator) => creator.user_id))
    )

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, avatar_url")
      .in("id", creatorUserIds)
      .returns<ProfileRow[]>()

    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

    const postIds = filteredPosts.map((post) => post.id)

    const { data: mediaRows } = await supabaseAdmin
      .from("media")
      .select("post_id, storage_path, type, mime_type, status, sort_order")
      .in("post_id", postIds)
      .eq("status", "ready")
      .order("sort_order", { ascending: true })
      .returns<MediaRow[]>()

    const mediaMap = new Map<string, MediaRow[]>()

    for (const media of mediaRows ?? []) {
      const current = mediaMap.get(media.post_id) ?? []
      current.push(media)
      mediaMap.set(media.post_id, current)
    }

    const items: HomeFeedItem[] = await Promise.all(
      filteredPosts.map(async (post) => {
        const creator = creatorMap.get(post.creator_id)
        const creatorUserId = creator?.user_id ?? ""
        const profile = profileMap.get(creatorUserId)

        const selectedMediaRows = (mediaMap.get(post.id) ?? []).slice(0, 3)

        const media = await Promise.all(
          selectedMediaRows.map(async (item) => ({
            url: await createMediaSignedUrl({
              storagePath: item.storage_path,
              viewerUserId,
              creatorUserId,
              visibility: post.visibility,
              isSubscribed: false,
              hasPurchased: false,
            }),
            type: resolveMediaType(item),
          }))
        )

        return {
          id: post.id,
          creatorId: post.creator_id,
          creatorUserId,
          currentUserId: viewerUserId,
          text: post.content ?? post.title ?? "",
          createdAt: post.published_at ?? post.created_at,
          isLocked: false,
          lockReason: "none" as const,
          media,
          creator: {
            username: creator?.username ?? "",
            displayName: creator?.display_name ?? null,
            avatarUrl: profile?.avatar_url ?? null,
          },
        }
      })
    )

    return {
      items,
      nextCursor: null,
    }
  }

  const { data: creators } = await supabaseAdmin
    .from("creators")
    .select(`
      id,
      user_id,
      username,
      display_name,
      profiles!inner (
        id,
        is_deactivated
      )
    `)
    .in("id", creatorIds)
    .eq("status", "active")
    .eq("profiles.is_deactivated", false)
    .returns<CreatorRow[]>()

  const creatorMap = new Map<string, CreatorRow>()
  const creatorUserIds: string[] = []

  for (const creator of creators ?? []) {
    creatorMap.set(creator.id, creator)
    creatorUserIds.push(creator.user_id)
  }

  if (creatorMap.size === 0) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, avatar_url")
    .in("id", creatorUserIds)
    .returns<ProfileRow[]>()

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  let query = supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, title, content, visibility, price_cents, created_at, published_at"
    )
    .in("creator_id", Array.from(creatorMap.keys()))
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(limit)

  if (input.cursor) {
    query = query.lt("published_at", input.cursor)
  }

  const { data: posts } = await query.returns<PostRow[]>()

  const postList = posts ?? []
  const postIds = postList.map((post) => post.id)

  const { data: payments } = await supabaseAdmin
    .from("payments")
    .select("target_id")
    .eq("user_id", viewerUserId)
    .eq("target_type", "post")
    .eq("status", "succeeded")
    .in("target_id", postIds)

  const purchasedSet = new Set((payments ?? []).map((payment) => payment.target_id))

  const { data: mediaRows } = await supabaseAdmin
    .from("media")
    .select("post_id, storage_path, type, mime_type, status, sort_order")
    .in("post_id", postIds)
    .eq("status", "ready")
    .order("sort_order", { ascending: true })
    .returns<MediaRow[]>()

  const mediaMap = new Map<string, MediaRow[]>()

  for (const media of mediaRows ?? []) {
    const current = mediaMap.get(media.post_id) ?? []
    current.push(media)
    mediaMap.set(media.post_id, current)
  }

  const items: HomeFeedItem[] = await Promise.all(
    postList.map(async (post) => {
      const creator = creatorMap.get(post.creator_id)
      const creatorUserId = creator?.user_id ?? ""
      const profile = profileMap.get(creatorUserId)

      const hasPurchased =
        post.visibility === "paid" && post.price_cents !== null
          ? purchasedSet.has(post.id)
          : false

      const hasAccess = canViewPost({
        viewerUserId,
        creatorId: creatorUserId,
        visibility: post.visibility,
        isSubscribed: true,
        hasPurchased,
      })

      const selectedMediaRows = hasAccess
        ? (mediaMap.get(post.id) ?? []).slice(0, 3)
        : []

      const media = await Promise.all(
        selectedMediaRows.map(async (item) => ({
          url: await createMediaSignedUrl({
            storagePath: item.storage_path,
            viewerUserId,
            creatorUserId,
            visibility: post.visibility,
            isSubscribed: true,
            hasPurchased,
          }),
          type: resolveMediaType(item),
        }))
      )

      return {
        id: post.id,
        creatorId: post.creator_id,
        creatorUserId,
        currentUserId: viewerUserId,
        text: hasAccess ? post.content ?? post.title ?? "" : "",
        createdAt: post.published_at ?? post.created_at,
        isLocked: !hasAccess,
        media,
        creator: {
          username: creator?.username ?? "",
          displayName: creator?.display_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
        },
      }
    })
  )

  return {
    items,
    nextCursor:
      items.length === limit
        ? items[items.length - 1]?.createdAt ?? null
        : null,
  }
}