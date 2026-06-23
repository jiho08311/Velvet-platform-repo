import {
  signUpWithAdultCheck as signUpWithAdultCheckRuntime,
} from "@/modules/auth/runtime/sign-up-with-adult-check"

export const PUBLIC_CONTRACT = true

export type SignUpWithAdultCheckInput = Parameters<
  typeof signUpWithAdultCheckRuntime
>[0]

export async function signUpWithAdultCheck(
  input: SignUpWithAdultCheckInput
): Promise<void> {
  await signUpWithAdultCheckRuntime(input)
}
