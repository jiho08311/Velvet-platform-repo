import { readSession, type SessionContext } from "./read-session"

export async function requireSession(): Promise<SessionContext> {
  const session = await readSession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  return session
}