// src/modules/profile/server/update-profile.ts
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type UpdateProfileInput = {
  userId: string
  displayName: string
  bio: string
  avatarUrl?: string | null
}

type ProfileRow = {
  id: string
  email: string | null
  username: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export async function updateProfile(input: UpdateProfileInput) {
  const sanitizedDisplayName = input.displayName.trim()
  const sanitizedBio = input.bio.trim()

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({
      display_name: sanitizedDisplayName,
      bio: sanitizedBio,
      avatar_url: input.avatarUrl ?? null,
    })
    .eq("id", input.userId)
    .select("id, email, username, display_name, avatar_url, bio, created_at")
    .single<ProfileRow>()

  if (error) {
    console.error("UPDATE PROFILE ERROR:", error)
    throw new Error("PROFILE_UPDATE_FAILED")
  }

  const { error: creatorUpdateError } = await supabaseAdmin
    .from("creators")
    .update({
      display_name: sanitizedDisplayName,
    })
    .eq("user_id", input.userId)

  if (creatorUpdateError) {
    console.error("UPDATE CREATOR DISPLAY NAME ERROR:", creatorUpdateError)
  }

  return {
    id: data.id,
    email: data.email,
    username: data.username,
    displayName: data.display_name ?? "",
    avatarUrl: data.avatar_url,
    bio: data.bio,
    createdAt: data.created_at,
  }
}