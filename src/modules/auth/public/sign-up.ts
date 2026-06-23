import type { AuthResponse } from "@supabase/supabase-js"
import { signUp as signUpRuntime } from "@/modules/auth/runtime/sign-up"

export const PUBLIC_CONTRACT = true

export type SignUpInput = {
  email: string
  password: string
}

export async function signUp(input: SignUpInput): Promise<AuthResponse> {
  return signUpRuntime(input)
}
