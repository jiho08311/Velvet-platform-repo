import type { User } from "@supabase/supabase-js"
import {
  requireOnboardingReadyUser as requireOnboardingReadyUserRuntime,
} from "@/modules/auth/runtime/require-onboarding-ready-user"

export const PUBLIC_CONTRACT = true

export type RequireOnboardingReadyUserInput = {
  signInNext: string
}

export async function requireOnboardingReadyUser(
  input: RequireOnboardingReadyUserInput
): Promise<User> {
  return requireOnboardingReadyUserRuntime(input)
}
