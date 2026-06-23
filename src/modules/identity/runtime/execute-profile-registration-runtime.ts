import { buildDefaultUsername } from "@/modules/identity/policies/default-username-policy"
import { upsertRegisteredProfile } from "@/modules/identity/repositories/profile-registration-repository"

export type ExecuteProfileRegistrationInput = {
  profileId: string
  email: string
  displayName: string
  username?: string | null
  birthDate?: string | null
}

export async function executeProfileRegistration({
  profileId,
  email,
  displayName,
  username,
  birthDate,
}: ExecuteProfileRegistrationInput) {
  const now = new Date().toISOString()
  const resolvedUsername =
    username?.trim().toLowerCase() || buildDefaultUsername(email, profileId)

  const data = await upsertRegisteredProfile({
    profileId,
    email,
    displayName,
    username: resolvedUsername,
    birthDate: birthDate ?? null,
    registeredAt: now,
  })

  return {
    id: data.profile_id,
    email,
    username: data.username ?? resolvedUsername,
    displayName: data.display_name ?? displayName,
    avatarUrl: null,
    bio: null,
    birthDate: birthDate ?? null,
    isAdultVerified: false,
    adultVerifiedAt: null,
    adultVerificationMethod: null,
    createdAt: data.created_at,
  }
}
