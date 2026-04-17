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
  is_deactivated: boolean
is_delete_pending: boolean | null
deleted_at: string | null
is_banned: boolean
}

export async function getProfileByUsername(
  username: string
): Promise<PublicProfile | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, is_deactivated, is_delete_pending, deleted_at, is_banned")
    .eq("username", username)
    .maybeSingle<ProfileRow>()

  if (error) {
    throw error
  }

 if (
  !data ||
  data.is_deactivated ||
  data.is_delete_pending ||
  data.deleted_at ||
  data.is_banned
) {
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