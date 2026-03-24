import type { Profile } from "../types"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ProfileRow = {
  id: string
  email: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, username, display_name, avatar_url, bio, created_at")
    .eq("id", userId)
    .maybeSingle<ProfileRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

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