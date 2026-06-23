import { upsertPassAdultVerification } from "@/modules/auth/repositories/pass-verification-repository"
type CompletePassVerificationParams = {
  requestId: string
  profileId: string
  mock: string | null
}

export async function completePassVerification({
  requestId,
  profileId,
  mock,
}: CompletePassVerificationParams) {
  if (!requestId) {
    throw new Error("requestId is required")
  }

  if (!profileId) {
    throw new Error("profileId is required")
  }

  if (mock !== "true") {
    throw new Error("invalid pass verification response")
  }

  const now = new Date().toISOString()

  await upsertPassAdultVerification({
    requestId,
    profileId,
    verifiedAt: now,
  })

  return {
    success: true,
  }
}
