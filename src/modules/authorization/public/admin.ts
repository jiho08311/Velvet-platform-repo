import type { AdminRole } from "@/modules/admin/public/admin-role-policy"
import { executeAdminAuthorityRuntime } from "@/modules/admin/public/admin-authority"

export const PUBLIC_CONTRACT = true

export type CanAccessAdminInput = {
  roles?: AdminRole[]
}

export type CanAccessAdminResult = Awaited<ReturnType<typeof canAccessAdmin>>

export async function canAccessAdmin(input?: CanAccessAdminInput) {
  const contract = await executeAdminAuthorityRuntime({
    roles: input?.roles,
  })

  return {
    allowed: contract.allowed,
    reason: contract.allowed ? null : contract.reason,
    user: contract.user,
    roles: contract.roles,
  }
}
