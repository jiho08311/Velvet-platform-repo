import {
  searchCreatorsRuntime,
  type SearchCreatorsInput,
} from "@/modules/search/runtime/search-creators-runtime"

export async function searchCreators(input: SearchCreatorsInput) {
  return searchCreatorsRuntime(input)
}
