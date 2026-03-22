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
        started_at,
        user_id,
        users (
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

  return (data ?? []).map((subscription) => {
    const user = Array.isArray(subscription.users)
      ? subscription.users[0]
      : subscription.users

    return {
      id: subscription.id,
      status: subscription.status,
      startedAt: subscription.started_at ?? subscription.created_at,
      userId: user?.id ?? "",
      username: user?.username ?? "",
      displayName: user?.display_name ?? "",
      avatarUrl: user?.avatar_url ?? null,
    }
  })
}