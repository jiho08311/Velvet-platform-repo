import type { Profile } from "../types"
import { readProfileRowByUserId } from "@/modules/profile/repositories/profile-read-repository"

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const { data, error } = await readProfileRowByUserId(userId)

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