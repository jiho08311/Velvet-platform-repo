import { readCreatorRowByUserId } from "@/modules/creator/repositories/creator-read-repository"
import {
  readBasicCreatorProfileRowByUserId,
  readPublicCreatorProfileRowByUserId,
} from "@/modules/creator/repositories/creator-read-repository"
import { upsertCreatorPublicCard } from "@/modules/creator/repositories/creator-public-card-repository"
import { buildCreatorPublicCard } from "./build-creator-public-card"

export async function rebuildCreatorPublicCardByUserId(userId: string) {
  const [
    creatorResult,
    profileResult,
    canonicalProfileResult,
  ] = await Promise.all([
    readCreatorRowByUserId(userId),
    readPublicCreatorProfileRowByUserId(userId),
    readBasicCreatorProfileRowByUserId(userId),
  ])

  if (creatorResult.error) throw creatorResult.error
  if (profileResult.error) throw profileResult.error
  if (canonicalProfileResult.error) throw canonicalProfileResult.error

  const creator = creatorResult.data

  if (!creator) {
    return {
      status: "skipped" as const,
      reason: "creator_not_found",
    }
  }

  const profile = profileResult.data
  const canonicalProfile = canonicalProfileResult.data

  const card = buildCreatorPublicCard({
    creator: {
      id: creator.id,
      user_id: creator.user_id,
      username: creator.username ?? profile?.username ?? null,
      display_name: profile?.display_name ?? null,
      status: creator.status ?? null,
    },
    profile,
    canonicalCreator: {
      creator_lifecycle_state: creator.status ?? null,
      creator_visibility_state: creator.creator_visibility_state ?? null,
    },
    canonicalProfile: canonicalProfile
      ? {
          profile_lifecycle_state: canonicalProfile.is_deactivated
            ? "deactivated"
            : canonicalProfile.is_delete_pending
              ? "delete_pending"
              : "active",
          identity_visibility_state: canonicalProfile.is_banned
            ? "not_visible"
            : null,
        }
      : null,
  })

  await upsertCreatorPublicCard(card)

  return {
    status: "completed" as const,
    creatorId: creator.id,
  }
}