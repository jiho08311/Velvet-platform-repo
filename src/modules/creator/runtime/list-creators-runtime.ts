import { isPublicCreatorProfileVisible } from "@/modules/creator/policies/is-public-creator-profile-visible"
import {
  readActiveCreatorRows,
  readPublicCreatorProfileRowsByUserIds,
} from "@/modules/creator/repositories/creator-read-repository"
import { buildCreatorIdentity } from "@/modules/creator/mappers/build-creator-identity"


type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  is_deactivated: boolean | null
  is_delete_pending: boolean | null
  deleted_at: string | null
  is_banned: boolean | null
}

export type ListCreatorsInput = {
  limit?: number
}

export async function listCreatorsRuntime({
  limit = 20,
}: ListCreatorsInput = {}): Promise<
  Array<{
    id: string
    userId: string
    username: string
    displayName: string
    avatarUrl: string | null
    bio: string
    status: "pending" | "active" | "suspended" | "banned" | "inactive"
    subscriptionPrice: number
    subscriptionCurrency: string
    createdAt: string
    updatedAt: string
  }>
> {
  const { data: creators, error: creatorsError } =
    await readActiveCreatorRows(limit)

  if (creatorsError) throw creatorsError
  if (!creators || creators.length === 0) return []

  const userIds = creators.map((creator) => creator.user_id)

const { data: profiles, error: profilesError } =
  await readPublicCreatorProfileRowsByUserIds(userIds)

  if (profilesError) throw profilesError

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  )

  return creators
    .filter((creator) =>
      isPublicCreatorProfileVisible({
        creator: {
          status: creator.status,
          creatorVisibilityState: creator.creator_visibility_state,
        },
        profile: profileMap.has(creator.user_id)
          ? {
              isDeactivated:
                profileMap.get(creator.user_id)?.is_deactivated ?? null,
              isDeletePending:
                profileMap.get(creator.user_id)?.is_delete_pending ?? null,
              deletedAt: profileMap.get(creator.user_id)?.deleted_at ?? null,
              isBanned: profileMap.get(creator.user_id)?.is_banned ?? null,
            }
          : null,
      })
    )
    .map((creator) => {
      const profile = profileMap.get(creator.user_id)!

      const identity = buildCreatorIdentity({
        creator,
        profile,
      })

      return {
        id: identity.id,
        userId: identity.userId,
        username: identity.username,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
        bio: identity.bio,
        status: creator.status,
        subscriptionPrice: creator.subscription_price,
        subscriptionCurrency: creator.subscription_currency,
        createdAt: creator.created_at,
        updatedAt: creator.updated_at,
      }
    })
}