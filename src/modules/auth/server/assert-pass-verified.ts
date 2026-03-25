import { getAdultVerificationStatus } from "@/modules/profile/server/get-adult-verification-status"

type AssertPassVerifiedParams = {
  profileId: string
}

export async function assertPassVerified({
  profileId,
}: AssertPassVerifiedParams) {
  if (process.env.NODE_ENV !== "production") {
    return {
      success: true,
    }
  }

  const verification = await getAdultVerificationStatus({ profileId })

  if (
    !verification.isAdultVerified ||
    verification.adultVerificationMethod !== "pass"
  ) {
    throw new Error("PASS verification is required")
  }

  return {
    success: true,
  }
}