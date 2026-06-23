import { requireUser } from "@/modules/auth/public/require-user"
import {
  getAdminRolesForProfile,
  hasAdminMembership,
  hasRequiredAdminRole,
  type AdminRole,
} from "@/modules/admin/policies/admin-role-policy"
import {
  createAdminAuthorityContract,
  createAdminAuthorityDeniedContract,
  type AdminAuthorityContract,
} from "@/modules/admin/contracts/admin-authority-contract"

export type ExecuteAdminAuthorityRuntimeInput = {
  roles?: AdminRole[]
}

export async function executeAdminAuthorityRuntime(
  input: ExecuteAdminAuthorityRuntimeInput = {}
): Promise<AdminAuthorityContract> {
  const user = await requireUser()
  const userRoles = await getAdminRolesForProfile(user.id)

  if (!(await hasAdminMembership(user.id))) {
    return createAdminAuthorityDeniedContract({
      reason: "admin_access_required",
      user,
      roles: userRoles,
      requiredRoles: input.roles,
    })
  }

  if (
    input.roles?.length &&
    !(await hasRequiredAdminRole({
      profileId: user.id,
      requiredRoles: input.roles,
    }))
  ) {
    return createAdminAuthorityDeniedContract({
      reason: "admin_role_required",
      user,
      roles: userRoles,
      requiredRoles: input.roles,
    })
  }

  return createAdminAuthorityContract({
    user,
    roles: userRoles,
    requiredRoles: input.roles,
  })
}