// src/modules/auth/runtime/create-user-profile.ts
import { executeProfileRegistration } from "@/modules/identity/public/profile-registration"

type CreateUserProfileInput = {
  id: string
  email: string
  displayName: string
  username: string
  birthDate: string
}

export function buildDefaultUsername(email: string, userId: string) {
  const base =
    email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") || "user"

  return `${base}_${userId.slice(0, 4)}`
}

export async function createUserProfile(input: CreateUserProfileInput) {
  return executeProfileRegistration({
    profileId: input.id,
    email: input.email,
    displayName: input.displayName,
    username: input.username,
    birthDate: input.birthDate,
  })
}