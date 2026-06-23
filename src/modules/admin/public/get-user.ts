// src/modules/admin/public/get-user.ts
import { getUser as getUserRuntime } from "@/modules/admin/runtime/get-user"

export const PUBLIC_CONTRACT = true

export type AdminUser = NonNullable<Awaited<ReturnType<typeof getUserRuntime>>>

export async function getUser(userId: string): Promise<AdminUser | null> {
  return getUserRuntime(userId)
}
