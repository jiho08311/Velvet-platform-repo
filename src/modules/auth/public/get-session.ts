import {
  getSession as getSessionRuntime,
} from "@/modules/auth/runtime/get-session"
import type { AuthSession } from "@/modules/auth/types"

export const PUBLIC_CONTRACT = true

export async function getSession(): Promise<AuthSession | null> {
  return getSessionRuntime()
}
