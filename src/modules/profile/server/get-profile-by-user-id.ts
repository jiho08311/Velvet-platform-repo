import type { Profile } from "../types"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ProfileRow = {
  id: string
  email: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  birth_date: string | null
  is_adult_verified: boolean | null
  adult_verified_at: string | null
  adult_verification_method: "self_reported" | "pass" | null
  created_at: string
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, email, username, display_name, avatar_url, bio, birth_date, is_adult_verified, adult_verified_at, adult_verification_method, created_at"
    )
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
    avatarUrl: data.avatar_url ?? null,
    bio: data.bio ?? null,
    birthDate: data.birth_date ?? null,
    isAdultVerified: data.is_adult_verified ?? false,
    adultVerifiedAt: data.adult_verified_at ?? null,
    adultVerificationMethod: data.adult_verification_method ?? null,
    createdAt: data.created_at,
  }
}