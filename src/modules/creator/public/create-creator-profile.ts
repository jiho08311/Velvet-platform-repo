import {
  createCreatorProfile as createCreatorProfileRuntime,
} from "@/modules/creator/runtime/create-creator-profile"

export const PUBLIC_CONTRACT = true

export type CreateCreatorProfileInput = Parameters<typeof createCreatorProfileRuntime>[0]
export type CreateCreatorProfileResult = Awaited<
  ReturnType<typeof createCreatorProfileRuntime>
>

export function createCreatorProfile(
  input: CreateCreatorProfileInput
): ReturnType<typeof createCreatorProfileRuntime> {
  return createCreatorProfileRuntime(input)
}
