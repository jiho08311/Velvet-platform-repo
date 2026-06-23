import {
  createProfile as createProfileRuntime,
} from "@/modules/profile/runtime/create-profile"

export const PUBLIC_CONTRACT = true

export type CreateProfileInput = Parameters<typeof createProfileRuntime>[0]
export type CreateProfileResult = Awaited<ReturnType<typeof createProfileRuntime>>

export function createProfile(
  input: CreateProfileInput
): ReturnType<typeof createProfileRuntime> {
  return createProfileRuntime(input)
}
