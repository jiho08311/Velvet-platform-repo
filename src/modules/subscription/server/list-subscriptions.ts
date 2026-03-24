import { createClient } from "@/infrastructure/supabase/server"

export async function listSubscriptions(creatorId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      `
        id,
        status,
        created_at,
        user_id,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `
    )
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error("Failed to load subscriptions")
  }

  return (data ?? []).map((subscription: any) => {
    const user = Array.isArray(subscription.profiles)
      ? subscription.profiles[0]
      : subscription.profiles

    return {
      id: subscription.id,
      status: subscription.status,
      startedAt: subscription.created_at,
      userId: user?.id ?? "",
      username: user?.username ?? "",
      displayName: user?.display_name ?? "",
      avatarUrl: user?.avatar_url ?? null,
    }
  })
}