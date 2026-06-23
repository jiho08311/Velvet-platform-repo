import { readCanonicalAdultVerificationRow } from "@/modules/identity/repositories/adult-verification-repository"

export type AdultVerificationStatusReadModel = {
  isAdultVerified: boolean
  method: "self_reported" | "pass" | null
}

function readBooleanMetadata(
  metadata: Record<string, unknown> | null,
  key: string,
): boolean | null {
  const value = metadata?.[key]
  return typeof value === "boolean" ? value : null
}

function readMethodMetadata(
  metadata: Record<string, unknown> | null,
): "self_reported" | "pass" | null {
  const value = metadata?.adultVerificationMethod

  if (value === "self_reported" || value === "pass") {
    return value
  }

  return null
}

export async function readAdultVerificationStatusRuntime({
  profileId,
}: {
  profileId: string
}): Promise<AdultVerificationStatusReadModel> {
  const canonical = await readCanonicalAdultVerificationRow(profileId)

  const canonicalVerified =
    canonical?.is_adult_verified ??
    readBooleanMetadata(canonical?.aggregate_metadata ?? null, "isAdultVerified")

  const method =
    canonical?.adult_verification_method ??
    readMethodMetadata(canonical?.aggregate_metadata ?? null)

  return {
    isAdultVerified: canonicalVerified ?? false,
    method,
  }
}
