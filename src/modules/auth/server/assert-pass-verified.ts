import { getAdultVerificationStatus } from "@/modules/profile/server/get-adult-verification-status"
import {
  buildPathWithNext,
  normalizeRedirectTarget,
  VERIFY_PASS_PATH,
} from "@/modules/auth/lib/redirect-handoff"

type AssertPassVerifiedParams = {
  profileId: string
}

type PassVerificationRedirectParams = {
  next?: string
}

export function normalizePassVerificationNext(next: string) {
  return normalizeRedirectTarget(next)
}

export function getPassVerificationRedirectPath({
  next,
}: PassVerificationRedirectParams = {}) {
  return buildPathWithNext({
    path: VERIFY_PASS_PATH,
    next,
  })
}

export async function assertPassVerified({
  profileId,
}: AssertPassVerifiedParams) {
  if (process.env.BYPASS_PASS_VERIFICATION === "true") {
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
