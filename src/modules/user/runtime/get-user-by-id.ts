// src/modules/user/server/get-user-by-id.ts
import type { User, UserId } from "@/modules/user"
import { readProfileIdentityByUserId } from "@/modules/identity/public/read-profile-identity"

export async function getUserById(userId: UserId): Promise<User | null> {
  const profile = await readProfileIdentityByUserId(userId)

  if (!profile) return null

  return {
    id: profile.id,
    email: "email" in profile && typeof profile.email === "string" ? profile.email : null,
    username:
      "username" in profile && typeof profile.username === "string"
        ? profile.username
        : "",
    createdAt:
      "created_at" in profile && typeof profile.created_at === "string"
        ? profile.created_at
        : "createdAt" in profile && typeof profile.createdAt === "string"
          ? profile.createdAt
          : new Date(0).toISOString(),
  }
}