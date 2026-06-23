import { isPublicCreatorProfileVisible } from "@/modules/creator/policies/is-public-creator-profile-visible"
import {
  readCreatorRowByUsername,
  readPublicCreatorProfileRowByUserId,
} from "@/modules/creator/repositories/creator-read-repository"

import { buildCreatorIdentity } from "../mappers/build-creator-identity"

export async function getCreatorByUsername(username?: string) {
  const name = username?.trim().toLowerCase()

  if (!name) return null

  const { data: creator, error: creatorError } =
    await readCreatorRowByUsername(name)

  if (creatorError) throw creatorError
  if (!creator) return null

  const { data: profile, error: profileError } =
    await readPublicCreatorProfileRowByUserId(creator.user_id)

  if (profileError) throw profileError

  if (
    !isPublicCreatorProfileVisible({
      creator: {
        status: creator.status,
        creatorVisibilityState: creator.creator_visibility_state,
      },
      profile: profile
        ? {
            isDeactivated: profile.is_deactivated,
            isDeletePending: profile.is_delete_pending,
            deletedAt: profile.deleted_at,
            isBanned: profile.is_banned,
          }
        : null,
    })
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
}
