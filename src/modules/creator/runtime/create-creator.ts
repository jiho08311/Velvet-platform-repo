import {
  createCreatorRuntime,
  type CreateCreatorInput,
} from "@/modules/creator/runtime/create-creator-runtime"

export async function createCreator(input: CreateCreatorInput) {
  return createCreatorRuntime(input)
}