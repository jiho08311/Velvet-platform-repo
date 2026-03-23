import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type UpdateProfileInput = {
  userId: string
  displayName: string
  bio: string
  avatarUrl?: string | null
}

export async function updateProfile(input: UpdateProfileInput) {
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      display_name: input.displayName,
      bio: input.bio,
      avatar_url: input.avatarUrl ?? null,
    })
    .eq("id", input.userId)
    .select()
    .single()

  if (profileError) throw profileError

  await supabaseAdmin
    .from("creators")
    .update({
      display_name: input.displayName,
    })
    .eq("user_id", input.userId)

  return profileData
}