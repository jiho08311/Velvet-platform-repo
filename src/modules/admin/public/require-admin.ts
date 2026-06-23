// src/modules/admin/public/require-admin.ts
import {
  requireAdmin as requireAdminRuntime,
} from "@/modules/admin/runtime/require-admin"

export const PUBLIC_CONTRACT = true

export type RequireAdminInput = Parameters<typeof requireAdminRuntime>[0]
export type RequireAdminResult = Awaited<ReturnType<typeof requireAdminRuntime>>

export async function requireAdmin(
  input?: RequireAdminInput
): Promise<RequireAdminResult> {
  return requireAdminRuntime(input)
}
