import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type PublicProfile = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
}

type ProfileRow = {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
}

export async function getProfileByUsername(
  username: string
): Promise<PublicProfile | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .eq("username", username)
    .maybeSingle<ProfileRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    bio: data.bio,
  }
}