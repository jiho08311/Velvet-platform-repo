// src/modules/admin/public/list-users.ts
import { listUsers as listUsersRuntime } from "@/modules/admin/runtime/list-users"

export const PUBLIC_CONTRACT = true

export type ListUsersInput = Parameters<typeof listUsersRuntime>[0]
export type AdminUserOperationalModel = Awaited<
  ReturnType<typeof listUsersRuntime>
>[number]

export async function listUsers(
  input?: ListUsersInput
): Promise<AdminUserOperationalModel[]> {
  return listUsersRuntime(input)
}
