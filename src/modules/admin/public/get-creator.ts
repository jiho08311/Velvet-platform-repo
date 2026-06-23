// src/modules/admin/public/get-creator.ts
import { getCreator as getCreatorRuntime } from "@/modules/admin/runtime/get-creator"

export const PUBLIC_CONTRACT = true

export type AdminCreator = NonNullable<Awaited<ReturnType<typeof getCreatorRuntime>>>

export async function getCreator(
  creatorId: string
): Promise<AdminCreator | null> {
  return getCreatorRuntime(creatorId)
}
