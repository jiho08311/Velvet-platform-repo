import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type PublicUpcomingFeedItem = {
  id: string
  creatorId: string
  creatorUserId: string
  title: string
  previewText: string | null
  scheduledAt: string
  creator: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

type PostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  published_at: string | null
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

export async function getPublicUpcomingPosts(
  limit = 3
): Promise<PublicUpcomingFeedItem[]> {
  const now = new Date().toISOString()

  const { data: posts, error: postsError } = await supabaseAdmin
    .from("posts")
    .select("id, creator_id, title, content, published_at")
    .eq("status", "draft")
    .eq("visibility", "public")
    .gt("published_at", now)
    .is("deleted_at", null)
    .order("published_at", { ascending: true })
    .limit(limit)
    .returns<PostRow[]>()

  if (postsError) {
    throw postsError
  }

  const resolvedPosts = posts ?? []

  if (resolvedPosts.length === 0) {
    return []
  }

  const creatorIds = Array.from(
    new Set(resolvedPosts.map((post) => post.creator_id))
  )

  const { data: creators, error: creatorsError } = await supabaseAdmin
    .from("creators")
    .select(`
      id,
      user_id,
      username,
      display_name,
      profiles!inner (
        id,
        avatar_url,
        is_deactivated,
        is_delete_pending,
        deleted_at
      )
    `)
    .in("id", creatorIds)
    .eq("status", "active")
    .eq("profiles.is_deactivated", false)
    .eq("profiles.is_delete_pending", false)
    .is("profiles.deleted_at", null)
    .returns<CreatorRow[]>()

  if (creatorsError) {
    throw creatorsError
  }

  const creatorMap = new Map<string, CreatorRow>()
  const creatorUserIds: string[] = []

  for (const creator of creators ?? []) {
    creatorMap.set(creator.id, creator)
    creatorUserIds.push(creator.user_id)
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, avatar_url")
    .in("id", creatorUserIds)
    .returns<ProfileRow[]>()

  if (profilesError) {
    throw profilesError
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  )

  return resolvedPosts
    .filter((post) => creatorMap.has(post.creator_id))
    .map((post) => {
      const creator = creatorMap.get(post.creator_id)!
      const profile = profileMap.get(creator.user_id)

      return {
        id: post.id,
        creatorId: post.creator_id,
        creatorUserId: creator.user_id,
        title: post.title?.trim() || "Upcoming post",
        previewText: post.content?.trim() || null,
        scheduledAt: post.published_at ?? "",
        creator: {
          username: creator.username,
          displayName: creator.display_name,
          avatarUrl: profile?.avatar_url ?? null,
        },
      }
    })
}