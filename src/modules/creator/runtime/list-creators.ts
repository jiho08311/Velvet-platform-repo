import {
  listCreatorsRuntime,
  type ListCreatorsInput,
} from "@/modules/creator/runtime/list-creators-runtime"

export async function listCreators(input: ListCreatorsInput = {}) {
  return listCreatorsRuntime(input)
}
