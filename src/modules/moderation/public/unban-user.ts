// src/modules/moderation/public/unban-user.ts
import { unbanUser as unbanUserRuntime } from "@/modules/moderation/runtime/unban-user"

export const PUBLIC_CONTRACT = true

export type UnbanUserInput = Parameters<typeof unbanUserRuntime>[0]
export type UnbanUserResult = Awaited<ReturnType<typeof unbanUserRuntime>>

export function unbanUser(
  input: UnbanUserInput
): ReturnType<typeof unbanUserRuntime> {
  return unbanUserRuntime(input)
}
