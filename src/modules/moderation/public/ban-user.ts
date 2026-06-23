// src/modules/moderation/public/ban-user.ts
import { banUser as banUserRuntime } from "@/modules/moderation/runtime/ban-user"

export const PUBLIC_CONTRACT = true

export type BanUserInput = Parameters<typeof banUserRuntime>[0]
export type BanUserResult = Awaited<ReturnType<typeof banUserRuntime>>

export function banUser(input: BanUserInput): ReturnType<typeof banUserRuntime> {
  return banUserRuntime(input)
}
