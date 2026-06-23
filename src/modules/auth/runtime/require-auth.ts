import type { AuthSession } from "../types"

export type RequireAuthOptions = {
  session?: AuthSession | null
  getSession?: () => Promise<AuthSession | null>
}

export async function requireAuth(
  options: RequireAuthOptions = {}
): Promise<AuthSession> {
  const session =
    options.session ??
    (options.getSession ? await options.getSession() : null)

  if (!session) {
    throw new Error("Authentication required")
  }

  if (session.status !== "active") {
    throw new Error("Session is not active")
  }

  return session
}