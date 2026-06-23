import { hasRequiredAdminRole } from "@/modules/admin/public/admin-role-policy"

export async function canDeleteAccount(input: {
  actorId: string
  targetUserId: string
}) {
  if (input.actorId === input.targetUserId) {
    const isSuperAdmin = await hasRequiredAdminRole({
      profileId: input.actorId,
      requiredRoles: ["super_admin"],
    })

    return {
      allowed: !isSuperAdmin,
      reason: isSuperAdmin ? "super_admin_self_delete_forbidden" : null,
    }
  }

  const isSuperAdmin = await hasRequiredAdminRole({
    profileId: input.actorId,
    requiredRoles: ["super_admin"],
  })

  return {
    allowed: isSuperAdmin,
    reason: isSuperAdmin ? null : "super_admin_required",
  }
}

export async function canReactivateAccount(input: {
  actorId: string
  targetUserId: string
}) {
  return {
    allowed: input.actorId === input.targetUserId,
    reason:
      input.actorId === input.targetUserId ? null : "self_reactivation_required",
  }
}

export async function canEditProfile(input: {
  actorId: string
  profileId: string
}) {
  return {
    allowed: input.actorId === input.profileId,
    reason: input.actorId === input.profileId ? null : "profile_owner_required",
  }
}