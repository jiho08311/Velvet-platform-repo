import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { buildCreatorIdentity } from "@/modules/creator/server/build-creator-identity"
import {
  filterPublicDiscoveryPostCandidates,
  isEligiblePublicDiscoveryCreatorRow,
} from "@/modules/post/lib/public-discovery-inclusion"

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
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | "needs_review" | null
  published_at: string | null
  deleted_at: string | null
}

type CreatorRow = {
  id: string
  user_id: string
  username: string
  display_name: string | null
  status: "active" | "pending" | "suspended" | "inactive"
  profiles: {
    id: string
    username?: string | null
    display_name?: string | null
    avatar_url: string | null
    bio?: string | null
    is_deactivated: boolean | null
    is_delete_pending: boolean | null
    deleted_at: string | null
    is_banned: boolean | null
  } | null
}

export async function getPublicUpcomingPosts(
  limit = 3
): Promise<PublicUpcomingFeedItem[]> {
  const now = new Date().toISOString()

  const { data: posts, error: postsError } = await supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, title, content, status, visibility, visibility_status, moderation_status, published_at, deleted_at"
    )
    .eq("status", "scheduled")
    .eq("visibility", "public")
    .gt("published_at", now)
    .is("deleted_at", null)
    .order("published_at", { ascending: true })
    .limit(limit)
    .returns<PostRow[]>()

  if (postsError) {
    throw postsError
  }

  const resolvedPosts = filterPublicDiscoveryPostCandidates(posts ?? [], now, [
    "upcoming",
  ]).map(({ post }) => post)

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
      status,
      profiles (
        id,
        avatar_url,
        is_deactivated,
        is_delete_pending,
        deleted_at,
        is_banned
      )
    `)
    .in("id", creatorIds)
    .returns<CreatorRow[]>()

  if (creatorsError) {
    throw creatorsError
  }

  const visibleCreatorMap = new Map<string, CreatorRow>()

  for (const creator of creators ?? []) {
    if (isEligiblePublicDiscoveryCreatorRow(creator)) {
      visibleCreatorMap.set(creator.id, creator)
    }
  }

  return resolvedPosts
    .filter((post) => visibleCreatorMap.has(post.creator_id))
    .map((post) => {
      const creator = visibleCreatorMap.get(post.creator_id)!
      const identity = buildCreatorIdentity({
        creator,
        profile: creator.profiles,
      })

      return {
        id: post.id,
        creatorId: post.creator_id,
        creatorUserId: creator.user_id,
        title: post.title?.trim() || "Upcoming post",
        previewText: post.content?.trim() || null,
        scheduledAt: post.published_at ?? "",
        creator: {
          username: identity.username,
          displayName: identity.displayName,
          avatarUrl: identity.avatarUrl,
        },
      }
    })
}
