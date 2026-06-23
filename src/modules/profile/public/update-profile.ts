import {
  updateProfile as updateProfileRuntime,
} from "@/modules/profile/runtime/update-profile"

export const PUBLIC_CONTRACT = true

export type UpdateProfileInput = Parameters<typeof updateProfileRuntime>[0]
export type UpdateProfileResult = Awaited<ReturnType<typeof updateProfileRuntime>>

export function updateProfile(
  input: UpdateProfileInput
): ReturnType<typeof updateProfileRuntime> {
  return updateProfileRuntime(input)
}
