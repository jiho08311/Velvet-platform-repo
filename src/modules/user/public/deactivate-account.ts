import {
  deactivateAccount as deactivateAccountRuntime,
} from "@/modules/user/runtime/deactivate-account"

export const PUBLIC_CONTRACT = true

export type DeactivateAccountInput = Parameters<typeof deactivateAccountRuntime>[0]
export type DeactivateAccountResult = Awaited<ReturnType<typeof deactivateAccountRuntime>>

export function deactivateAccount(
  input: DeactivateAccountInput
): ReturnType<typeof deactivateAccountRuntime> {
  return deactivateAccountRuntime(input)
}
