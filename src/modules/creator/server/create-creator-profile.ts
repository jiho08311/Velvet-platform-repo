import { createClient } from "@/infrastructure/supabase/server"

type CreateCreatorProfileInput = {
  userId: string
}

function buildDefaultUsername(userId: string) {
  return `creator_${userId.slice(0, 8)}`
}

export async function createCreatorProfile({
  userId,
}: CreateCreatorProfileInput) {
  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", userId)
    .single()

  if (profileError || !profile) {
    console.error("createCreatorProfile profile lookup error:", profileError)
    throw profileError ?? new Error("Profile not found")
  }

  const username = buildDefaultUsername(userId)

  const { data, error } = await supabase
    .from("creators")
    .insert({
      user_id: userId,
      username,
      display_name: profile.display_name ?? profile.username ?? username,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      const { data: existing, error: fetchError } = await supabase
        .from("creators")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      return existing
    }

    console.error("createCreatorProfile error:", error)
    throw error
  }

  return data
}