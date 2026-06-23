// src/modules/identity/public/identity-side-effects.ts

import {
  runIdentitySideEffects as runIdentitySideEffectsRuntime,
} from "@/modules/identity/runtime/run-identity-side-effects"

export const PUBLIC_CONTRACT = true

export type RunIdentitySideEffectsInput = Parameters<
  typeof runIdentitySideEffectsRuntime
>[0]

export async function runIdentitySideEffects(
  sideEffects: RunIdentitySideEffectsInput
): Promise<void> {
  return runIdentitySideEffectsRuntime(sideEffects)
}
