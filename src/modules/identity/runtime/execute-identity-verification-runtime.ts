// src/modules/identity/runtime/execute-identity-verification-runtime.ts
import { recordIdentityVerification } from "../repositories/profile-authority-repository"

export async function executeIdentityVerification(input: {
  profileId: string
  birthDate: string
  isAdultVerified: boolean
  verificationMethod: "self_reported" | "pass"
}) {
  const now = new Date().toISOString()

  const { error } = await recordIdentityVerification({
    profileId: input.profileId,
    birthDate: input.birthDate,
    isAdultVerified: input.isAdultVerified,
    verificationMethod: input.verificationMethod,
    context: {
      actorType: "system",
      reason: "identity_verification_recorded",
      sourceSurface: "profile.adult_verification",
      sourceSymbol: "executeIdentityVerification",
      occurredAt: now,
    },
  })

  if (error) throw new Error(error.message)
}