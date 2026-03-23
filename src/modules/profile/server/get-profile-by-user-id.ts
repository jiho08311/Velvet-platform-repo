// src/modules/profile/server/get-profile-by-user-id.ts

import type { Profile } from "../types"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ProfileRow = {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
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
    userId: data.id,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url ?? "",
    bio: data.bio ?? "",
  }
}