import type { AuthenticatedUser } from "@/modules/auth/contracts/auth-user-contract"
import { getCurrentUser } from "./get-current-user"

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  return user
}