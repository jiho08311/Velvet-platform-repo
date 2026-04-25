import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { isPublicCreatorProfileVisible } from "@/modules/creator/lib/is-public-creator-profile-visible"

import { buildCreatorIdentity } from "./build-creator-identity"

type CreatorRow = {
  id: string
  user_id: string
  status: "pending" | "active" | "suspended"
  subscription_price: number
  subscription_currency: string
  created_at: string
  updated_at: string
  username: string
}

type ProfileRow = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  is_deactivated: boolean
  is_delete_pending: boolean | null
  deleted_at: string | null
  is_banned: boolean
}

export async function getCreatorByUsername(username?: string) {
  const name = username?.trim().toLowerCase()

  if (!name) return null

  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select(
      "id, user_id, status, subscription_price, subscription_currency, created_at, updated_at, username"
    )
    .ilike("username", name)
    .maybeSingle<CreatorRow>()

  if (creatorError) throw creatorError
  if (!creator) return null

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, bio, is_deactivated, is_delete_pending, deleted_at, is_banned"
    )
    .eq("id", creator.user_id)
    .maybeSingle<ProfileRow>()

  if (profileError) throw profileError

  if (
    !isPublicCreatorProfileVisible({
      creator: {
        status: creator.status,
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
