import { readAdultVerificationRowByProfileId } from "@/modules/profile/repositories/profile-read-repository"
import { logger } from "@/shared/observability/structured-logger"

type GetAdultVerificationStatusParams = {
  profileId: string
}

export async function getAdultVerificationStatus({
  profileId,
}: GetAdultVerificationStatusParams) {
  const { data, error } = await readAdultVerificationRowByProfileId(profileId)

  if (error) {
    logger.error({
      event: "profile.adult_verification_status_read_failed",
      context: { profileId },
      error,
    })
    throw error
  }

  return {
    isAdultVerified: data?.is_adult_verified ?? false,
    adultVerificationMethod: data?.adult_verification_method ?? null,
  }
}
