import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type UpdateProfileInput = {
  userId: string
  displayName: string
  bio: string
  avatarUrl?: string | null
}

type ProfileRow = {
  id: string
  email: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export async function updateProfile(input: UpdateProfileInput) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({
      display_name: input.displayName,
      bio: input.bio,
      avatar_url: input.avatarUrl ?? null,
    })
    .eq("id", input.userId)
    .select("id, email, username, display_name, avatar_url, bio, created_at")
    .single<ProfileRow>()

  if (error) throw error

  await supabaseAdmin
    .from("creators")
    .update({
      display_name: input.displayName,
    })
    .eq("user_id", input.userId)

  return {
    id: data.id,
    email: data.email,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    createdAt: data.created_at,
  }
}