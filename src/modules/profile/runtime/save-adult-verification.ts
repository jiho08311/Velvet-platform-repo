// src/modules/profile/runtime/save-adult-verification.ts
import { executeIdentityVerification } from "@/modules/identity/public/identity-verification"
import type { AdultVerificationMethod } from "../types"

type SaveAdultVerificationParams = {
  profileId: string
  birthDate: string
  isAdultVerified: boolean
  verificationMethod: AdultVerificationMethod
}

export async function saveAdultVerification(input: SaveAdultVerificationParams) {
  return executeIdentityVerification({
    profileId: input.profileId,
    birthDate: input.birthDate,
    isAdultVerified: input.isAdultVerified,
    verificationMethod: input.verificationMethod ?? "self_reported",
  })
}