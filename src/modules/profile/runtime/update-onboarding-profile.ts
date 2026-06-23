import {
  normalizeUsername,
  validateUsername,
} from "@/modules/profile/policies/username-policy"
import { updateOnboardingUsername } from "@/modules/profile/services/onboarding-profile-service"

type UpdateOnboardingProfileParams = {
  profileId: string
  username: string
}

export async function updateOnboardingProfile({
  profileId,
  username,
}: UpdateOnboardingProfileParams) {
  const normalizedUsername = normalizeUsername(username)

  validateUsername(normalizedUsername)

  return updateOnboardingUsername({
    profileId,
    username: normalizedUsername,
  })
}