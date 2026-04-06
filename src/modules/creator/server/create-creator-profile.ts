import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CreateCreatorProfileInput = {
  userId: string
  instagramUsername?: string
}

export async function createCreatorProfile({
  userId,
  instagramUsername,
}: CreateCreatorProfileInput) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, username, display_name")
    .eq("id", userId)
    .maybeSingle()

  if (profileError) {
    console.error("createCreatorProfile profile lookup error:", profileError)
    throw profileError
  }

  if (!profile) {
    throw new Error("Profile not found")
  }

  const { data, error } = await supabaseAdmin
    .from("creators")
    .insert({
      user_id: userId,
      username: profile.username,
      display_name: profile.display_name ?? profile.username,
      status: "pending", // 🔥 여기 active → pending으로 수정
      subscription_price: 0,
      subscription_currency: "KRW",
      instagram_username: instagramUsername ?? null, // 🔥 추가
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from("creators")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

      if (fetchError) {
        throw fetchError
      }

      if (existing) {
        return existing
      }
    }

    console.error("createCreatorProfile error:", error)
    throw error
  }

  return data
}