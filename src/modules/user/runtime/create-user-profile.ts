// src/modules/user/server/create-user-profile.ts
import {
  executeCreatorAuthorityCreation,
  type ExecuteCreatorAuthorityCreationInput,
} from "@/modules/identity/public/creator-authority"
import { runIdentitySideEffects } from "@/modules/identity/public/identity-side-effects"

type CreateCreatorProfileInput = {
  userId: string
}

export async function createCreatorProfile({
  userId,
}: CreateCreatorProfileInput) {
  const input: ExecuteCreatorAuthorityCreationInput = {
    userId,
    instagramUsername: null,
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
  }

  const result = await executeCreatorAuthorityCreation(input)
  await runIdentitySideEffects(result.sideEffects)

  return result.data
}