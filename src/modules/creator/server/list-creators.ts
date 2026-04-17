import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CreatorRow = {
  id: string
  user_id: string
  status: "pending" | "active" | "suspended"
  subscription_price: number
  subscription_currency: string
  created_at: string
  updated_at: string
}

type ProfileRow = {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  is_deactivated: boolean | null
  is_delete_pending: boolean | null
deleted_at: string | null
is_banned: boolean | null
}

type ListCreatorsInput = {
  limit?: number
}

export async function listCreators({
  limit = 20,
}: ListCreatorsInput = {}): Promise<
  Array<{
    id: string
    userId: string
    username: string
    displayName: string
    avatarUrl: string
    bio: string
    status: "pending" | "active" | "suspended"
    subscriptionPrice: number
    subscriptionCurrency: string
    createdAt: string
    updatedAt: string
  }>
> {
  const { data: creators, error: creatorsError } = await supabaseAdmin
    .from("creators")
    .select(
      "id, user_id, status, subscription_price, subscription_currency, created_at, updated_at"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<CreatorRow[]>()

  if (creatorsError) throw creatorsError
  if (!creators || creators.length === 0) return []

  const userIds = creators.map((creator) => creator.user_id)

const { data: profiles, error: profilesError } = await supabaseAdmin
  .from("profiles")
  .select("id, username, display_name, avatar_url, bio, is_deactivated, is_delete_pending, deleted_at, is_banned")
  .in("id", userIds)
  .eq("is_deactivated", false)
  .eq("is_delete_pending", false)
  .eq("is_banned", false)
  .is("deleted_at", null)
  .returns<ProfileRow[]>()

  if (profilesError) throw profilesError

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  )

  return creators
    .filter((creator) => profileMap.has(creator.user_id))
    .map((creator) => {
      const profile = profileMap.get(creator.user_id)!

      return {
        id: creator.id,
        userId: creator.user_id,
        username: profile.username,
        displayName: profile.display_name ?? "",
        avatarUrl: profile.avatar_url ?? "",
        bio: profile.bio ?? "",
        status: creator.status,
        subscriptionPrice: creator.subscription_price,
        subscriptionCurrency: creator.subscription_currency,
        createdAt: creator.created_at,
        updatedAt: creator.updated_at,
      }
    })
}