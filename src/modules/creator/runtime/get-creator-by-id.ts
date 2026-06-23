import {
  readBasicCreatorProfileRowByUserId,
  readCreatorRowById,
} from "@/modules/creator/repositories/creator-read-repository"

import { buildCreatorIdentity } from "../mappers/build-creator-identity"

export type CreatorAdminDetail = {
  id: string
  userId: string
  username: string
  displayName: string
  subscriptionPrice: number
  subscriptionCurrency: string
  status: "active" | "banned" | "suspended"
  createdAt: string
}

export async function getCreatorById(
  creatorId: string
): Promise<CreatorAdminDetail | null> {
  const id = creatorId.trim()

  if (!id) {
    return null
  }

  const { data: creator, error: creatorError } = await readCreatorRowById(id)

  if (creatorError) {
    throw new Error("Failed to load creator")
  }

  if (!creator) {
    return null
  }

  const { data: profile, error: profileError } =
    await readBasicCreatorProfileRowByUserId(creator.user_id)

  if (profileError) {
    throw new Error("Failed to load creator profile")
  }

  const identity = buildCreatorIdentity({
    creator,
    profile,
  })

 const servingStatus =
  creator.status === "pending" || creator.status === "inactive"
    ? "suspended"
    : creator.status

  return {
    id: identity.id,
    userId: identity.userId,
    username: identity.username,
    displayName: identity.displayName,
    subscriptionPrice: creator.subscription_price ?? 0,
    subscriptionCurrency: creator.subscription_currency ?? "KRW",
    status: servingStatus,
    createdAt: creator.created_at,
  }
}