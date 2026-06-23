import {
  readDuplicateOnboardingUsernameProfileId,
  readOnboardingProfileIdById,
  updateOnboardingProfileUsername,
} from "@/modules/profile/repositories/profile-onboarding-repository"

type UpdateOnboardingUsernameParams = {
  profileId: string
  username: string
}

export async function updateOnboardingUsername({
  profileId,
  username,
}: UpdateOnboardingUsernameParams) {
  const { data: existingProfile, error: existingProfileError } =
    await readOnboardingProfileIdById(profileId)

  if (existingProfileError) {
    throw existingProfileError
  }

  if (!existingProfile) {
    throw new Error("프로필을 찾을 수 없습니다.")
  }

  const { data: duplicatedUsername, error: duplicatedUsernameError } =
    await readDuplicateOnboardingUsernameProfileId({
      profileId,
      username,
    })

  if (duplicatedUsernameError) {
    throw duplicatedUsernameError
  }

  if (duplicatedUsername) {
    throw new Error("이미 사용 중인 username입니다.")
  }

  const { error: updateError } = await updateOnboardingProfileUsername({
    profileId,
    username,
  })

  if (updateError) {
    throw updateError
  }

  return {
    success: true,
  }
}
