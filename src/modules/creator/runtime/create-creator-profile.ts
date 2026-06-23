import {
  createCreatorProfileRuntime,
  type CreateCreatorProfileInput,
} from "@/modules/creator/runtime/create-creator-profile-runtime"

export async function createCreatorProfile(input: CreateCreatorProfileInput) {
  return createCreatorProfileRuntime(input)
}