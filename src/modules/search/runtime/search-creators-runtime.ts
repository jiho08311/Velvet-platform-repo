import { readPublicCreatorRowsByUserIds } from "@/modules/creator/public/read-public-creators"
import { searchPublicProfileRowsByIdentityQuery } from "@/modules/profile/public/search-public-profiles"
import { buildCreatorIdentity } from "@/modules/creator/public/build-creator-identity"
import { isEligiblePublicDiscoveryCreator } from "@/modules/post/public/public-discovery-inclusion"

import type {
  CreatorSearchConnection,
  CreatorSearchResult,
} from "../creator-search-contract"

export type SearchCreatorsInput = {
  query: string
  limit?: number
  cursor?: string | null
}

type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url?: string | null
  bio?: string | null
  is_deactivated: boolean | null
  is_delete_pending: boolean | null
  deleted_at: string | null
  is_banned: boolean | null
}

export async function searchCreatorsRuntime(
  input: SearchCreatorsInput
): Promise<CreatorSearchConnection> {
  const query = input.query.trim()

  if (!query) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const limit = Math.max(1, Math.min(input.limit ?? 10, 50))
  const cursor = input.cursor?.trim() || null

const { data: profileRows, error: profileError } =
  await searchPublicProfileRowsByIdentityQuery({
    query,
    limit,
    cursor,
  })

  if (profileError) {
    throw profileError
  }

  const matchedProfiles = (profileRows ?? []) as ProfileRow[]

  if (matchedProfiles.length === 0) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const profileIds = matchedProfiles.map((profile) => profile.id)

const { data: creatorRows, error: creatorError } =
  await readPublicCreatorRowsByUserIds({
    userIds: profileIds,
    sourceSurface: "search.creator.public",
  })

  if (creatorError) {
    throw creatorError
  }

const creatorMap = new Map(
  (creatorRows ?? []).map((creator) => [creator.user_id, creator])
)

const items = matchedProfiles
  .filter((profile) => {
    const creator = creatorMap.get(profile.id)

    if (!creator) {
      return false
    }

    return isEligiblePublicDiscoveryCreator({
      creator: {
        status: "active",
      },
      profile,
    })
  })
  .map((profile) => {
    const creator = creatorMap.get(profile.id)!
      const identity = buildCreatorIdentity({
        creator,
        profile,
      })

      return {
        id: identity.id,
        bio: identity.bio || null,
        username: identity.username,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
        headline: null,
        isVerified: false,
      }
    })

  const result = {
    items,
    nextCursor:
      items.length === limit
        ? matchedProfiles[matchedProfiles.length - 1]?.username ?? null
        : null,
  }

  return result
}
