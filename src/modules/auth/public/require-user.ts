import type { AuthenticatedUser } from "@/modules/auth/contracts/auth-user-contract"
import { requireUser as requireUserRuntime } from "@/modules/auth/runtime/require-user"

export const PUBLIC_CONTRACT = true

export async function requireUser(): Promise<AuthenticatedUser> {
  return requireUserRuntime()
}
