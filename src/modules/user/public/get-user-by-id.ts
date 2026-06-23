import { getUserById as getUserByIdRuntime } from "@/modules/user/runtime/get-user-by-id"
export type { User, UserId } from "@/modules/user/types"

export const PUBLIC_CONTRACT = true

export type GetUserByIdInput = Parameters<typeof getUserByIdRuntime>[0]
export type GetUserByIdResult = Awaited<ReturnType<typeof getUserByIdRuntime>>

export function getUserById(
  input: GetUserByIdInput
): ReturnType<typeof getUserByIdRuntime> {
  return getUserByIdRuntime(input)
}
