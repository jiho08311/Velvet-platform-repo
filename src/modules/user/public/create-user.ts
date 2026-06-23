import { createUser as createUserRuntime } from "@/modules/user/runtime/create-user"
export type { User } from "@/modules/user/types"

export const PUBLIC_CONTRACT = true

export type CreateUserInput = Parameters<typeof createUserRuntime>[0]
export type CreateUserResult = Awaited<ReturnType<typeof createUserRuntime>>

export function createUser(
  input: CreateUserInput
): ReturnType<typeof createUserRuntime> {
  return createUserRuntime(input)
}
