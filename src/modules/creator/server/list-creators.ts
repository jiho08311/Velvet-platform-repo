import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CreatorRow = {
  id: string
  user_id: string
  status: "pending" | "active" | "suspended"
  subscription_price_cents: number
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
    subscriptionPriceCents: number
    subscriptionCurrency: string
    createdAt: string
    updatedAt: string
  }>
> {
  const { data: creators, error: creatorsError } = await supabaseAdmin
    .from("creators")
    .select(
      "id, user_id, status, subscription_price_cents, subscription_currency, created_at, updated_at"
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
    .select("id, username, display_name, avatar_url, bio")
    .in("id", userIds)
    .returns<ProfileRow[]>()

  if (profilesError) throw profilesError

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  )

  return creators.map((creator) => {
    const profile = profileMap.get(creator.user_id)

    return {
      id: creator.id,
      userId: creator.user_id,
      username: profile?.username ?? "",
      displayName: profile?.display_name ?? "",
      avatarUrl: profile?.avatar_url ?? "",
      bio: profile?.bio ?? "",
      status: creator.status,
      subscriptionPriceCents: creator.subscription_price_cents,
      subscriptionCurrency: creator.subscription_currency,
      createdAt: creator.created_at,
      updatedAt: creator.updated_at,
    }
  })
}