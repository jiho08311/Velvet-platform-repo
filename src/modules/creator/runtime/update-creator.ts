import {
  updateCreatorRuntime,
  type UpdateCreatorInput,
} from "@/modules/creator/runtime/update-creator-runtime"

export async function updateCreator(input: UpdateCreatorInput) {
  return updateCreatorRuntime(input)
}