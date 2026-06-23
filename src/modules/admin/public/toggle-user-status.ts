// src/modules/admin/public/toggle-user-status.ts
import {
  toggleUserStatus as toggleUserStatusRuntime,
} from "@/modules/admin/runtime/toggle-user-status"

export const PUBLIC_CONTRACT = true

export type ToggleUserStatusInput = Parameters<typeof toggleUserStatusRuntime>[0]
export type ToggleUserStatusResult = Awaited<
  ReturnType<typeof toggleUserStatusRuntime>
>

export async function toggleUserStatus(
  input: ToggleUserStatusInput
): Promise<ToggleUserStatusResult> {
  return toggleUserStatusRuntime(input)
}
