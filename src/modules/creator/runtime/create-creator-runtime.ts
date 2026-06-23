// src/modules/creator/runtime/create-creator-runtime.ts
import {
  executeCreatorAuthorityCreation,
  type ExecuteCreatorAuthorityCreationInput,
} from "@/modules/identity/public/creator-authority"
import { runIdentitySideEffects } from "@/modules/identity/public/identity-side-effects"

export type CreateCreatorInput = ExecuteCreatorAuthorityCreationInput

export async function createCreatorRuntime(input: CreateCreatorInput) {
  const result = await executeCreatorAuthorityCreation(input)

  await runIdentitySideEffects(result.sideEffects)

  return result.data
}