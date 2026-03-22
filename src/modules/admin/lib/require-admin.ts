import type { AuthSession } from "@/modules/auth/types"

export type AdminInfo = {
  userId: string
  role: "admin"
}

export type RequireAdminOptions = {
  userId?: string
  session?: AuthSession | null
  getUserRole?: (userId: string) => Promise<string | null>
}

export async function requireAdmin(
  options: RequireAdminOptions
): Promise<AdminInfo> {
  const userId = options.userId ?? options.session?.userId ?? null

  if (!userId) {
    throw new Error("Authentication required")
  }

  const role = options.getUserRole
    ? await options.getUserRole(userId)
    : null

  if (role !== "admin") {
    throw new Error("Admin access required")
  }

  return {
    userId,
    role: "admin",
  }
}