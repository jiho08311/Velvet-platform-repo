import type { AdminRole } from "@/modules/admin/policies/admin-role-policy"
import type { AuthenticatedUser } from "@/modules/auth/contracts/auth-user-contract"

export type AdminAuthorityDeniedReason =
  | "admin_access_required"
  | "admin_role_required"

export type AdminAuthorityContract =
  | {
      allowed: true
      user: AuthenticatedUser
      roles: AdminRole[]
      lineage: {
        governanceSource: "canonical_identity_governance"
        roleAuthority: "admin-role-policy"
        adminAuthority: "executeAdminAuthorityRuntime"
        requiredRoles: AdminRole[] | null
      }
    }
  | {
      allowed: false
      reason: AdminAuthorityDeniedReason
      user: AuthenticatedUser
      roles: AdminRole[]
      lineage: {
        governanceSource: "canonical_identity_governance"
        roleAuthority: "admin-role-policy"
        adminAuthority: "executeAdminAuthorityRuntime"
        requiredRoles: AdminRole[] | null
      }
    }

export function createAdminAuthorityContract(input: {
  user: AuthenticatedUser
  roles: AdminRole[]
  requiredRoles?: AdminRole[]
}): AdminAuthorityContract {
  const requiredRoles = input.requiredRoles?.length ? input.requiredRoles : null

  return {
    allowed: true,
    user: input.user,
    roles: input.roles,
    lineage: {
      governanceSource: "canonical_identity_governance",
      roleAuthority: "admin-role-policy",
      adminAuthority: "executeAdminAuthorityRuntime",
      requiredRoles,
    },
  }
}

export function createAdminAuthorityDeniedContract(input: {
  reason: AdminAuthorityDeniedReason
  user: AuthenticatedUser
  roles: AdminRole[]
  requiredRoles?: AdminRole[]
}): AdminAuthorityContract {
  const requiredRoles = input.requiredRoles?.length ? input.requiredRoles : null

  return {
    allowed: false,
    reason: input.reason,
    user: input.user,
    roles: input.roles,
    lineage: {
      governanceSource: "canonical_identity_governance",
      roleAuthority: "admin-role-policy",
      adminAuthority: "executeAdminAuthorityRuntime",
      requiredRoles,
    },
  }
}
