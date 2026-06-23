// src/modules/profile/runtime/create-profile.ts
import type { Profile, ProfileId } from "../types"
import { executeProfileRegistration } from "@/modules/identity/public/profile-registration"

type CreateProfileInput = {
  userId: string
  email: string
  username: string
  displayName: string
}

export async function createProfile({
  userId,
  email,
  username,
  displayName,
}: CreateProfileInput): Promise<Profile> {
  const profile = await executeProfileRegistration({
    profileId: userId,
    email,
    username,
    displayName,
  })

  return {
    id: profile.id as ProfileId,
    email: profile.email,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    birthDate: profile.birthDate,
    isAdultVerified: profile.isAdultVerified,
    adultVerifiedAt: profile.adultVerifiedAt,
    adultVerificationMethod: profile.adultVerificationMethod,
    createdAt: profile.createdAt,
  }
}