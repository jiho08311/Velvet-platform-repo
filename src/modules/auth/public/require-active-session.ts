import { requireActiveUser } from "@/modules/auth/runtime/require-active-user"
import { requireSession } from "./require-session"

export const PUBLIC_CONTRACT = true

export type ActiveSessionContext = {
  userId: string
  sessionId: string
  accountState: "active"
}

export async function requireActiveSession(): Promise<ActiveSessionContext> {
  const [user, session] = await Promise.all([
    requireActiveUser(),
    requireSession(),
  ])

  return {
    userId: user.id,
    sessionId: session.sessionId,
    accountState: "active",
  }
}
