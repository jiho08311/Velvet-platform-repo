// src/modules/admin/public/toggle-user-ban.ts
import {
  toggleUserBan as toggleUserBanRuntime,
} from "@/modules/admin/runtime/toggle-user-ban"

export const PUBLIC_CONTRACT = true

export type ToggleUserBanInput = Parameters<typeof toggleUserBanRuntime>[0]
export type ToggleUserBanResult = Awaited<ReturnType<typeof toggleUserBanRuntime>>

export async function toggleUserBan(
  input: ToggleUserBanInput
): Promise<ToggleUserBanResult> {
  return toggleUserBanRuntime(input)
}
