// src/modules/user/server/create-user.ts
import type { User } from "../types"
import { executeProfileRegistration } from "@/modules/identity/public/profile-registration"

type CreateUserInput = {
  id: string
  email: string
  username: string
}

export async function createUser({
  id,
  email,
  username,
}: CreateUserInput): Promise<User> {
  const profile = await executeProfileRegistration({
    profileId: id,
    email,
    username,
    displayName: username,
  })

  return {
    id: profile.id,
    email: profile.email,
    username: profile.username,
    createdAt: profile.createdAt,
  }
}