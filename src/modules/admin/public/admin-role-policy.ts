// src/modules/admin/public/admin-role-policy.ts
import {
  getAdminRolesForProfile as getAdminRolesForProfilePolicy,
  getAdminUserIdSet as getAdminUserIdSetPolicy,
  hasAdminMembership as hasAdminMembershipPolicy,
  hasRequiredAdminRole as hasRequiredAdminRolePolicy,
  isAdminProfile as isAdminProfilePolicy,
} from "@/modules/admin/policies/admin-role-policy"

export const PUBLIC_CONTRACT = true

export type AdminRole = Awaited<
  ReturnType<typeof getAdminRolesForProfilePolicy>
>[number]
export type HasRequiredAdminRoleInput = Parameters<
  typeof hasRequiredAdminRolePolicy
>[0]

export async function getAdminRolesForProfile(
  profileId: string
): Promise<AdminRole[]> {
  return getAdminRolesForProfilePolicy(profileId)
}

export async function getAdminUserIdSet(): Promise<Set<string>> {
  return getAdminUserIdSetPolicy()
}

export async function hasAdminMembership(profileId: string): Promise<boolean> {
  return hasAdminMembershipPolicy(profileId)
}

export async function hasRequiredAdminRole(
  input: HasRequiredAdminRoleInput
): Promise<boolean> {
  return hasRequiredAdminRolePolicy(input)
}

export async function isAdminProfile(profileId: string): Promise<boolean> {
  return isAdminProfilePolicy(profileId)
}
