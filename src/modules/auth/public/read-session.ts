import { getSession } from "@/modules/auth/runtime/get-session"

export const PUBLIC_CONTRACT = true

export type SessionContext = {
  userId: string
  sessionId: string
}

export async function readSession(): Promise<SessionContext | null> {
  const session = await getSession()

  if (!session || session.status !== "active") {
    return null
  }

  return {
    userId: session.userId,
    sessionId: session.id,
  }
}
