import { executeProfileDisplayUpdate } from "@/modules/identity/public/profile-display-update"

export type UpdateProfileInput = {
  userId: string
  displayName: string
  bio: string
  avatarUrl?: string | null
}

export function updateProfileRuntime(input: UpdateProfileInput) {
  return executeProfileDisplayUpdate({
    profileId: input.userId,
    displayName: input.displayName,
    bio: input.bio,
    avatarUrl: input.avatarUrl,
  })
}