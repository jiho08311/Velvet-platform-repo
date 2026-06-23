import {
  updateProfileRuntime,
  type UpdateProfileInput,
} from "@/modules/profile/runtime/update-profile-runtime"

export async function updateProfile(
  input: UpdateProfileInput
) {
  return updateProfileRuntime(input)
}