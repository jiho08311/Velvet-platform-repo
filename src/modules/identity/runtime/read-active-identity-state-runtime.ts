import {
  readCanonicalProfileStatus,
  resolveActiveIdentityState,
} from "../repositories/identity-read-model-repository"

export async function readActiveIdentityState({
  userId,
}: {
  userId: string
}) {
  const { data: canonical } = await readCanonicalProfileStatus(userId)

  return resolveActiveIdentityState({ canonical })
}