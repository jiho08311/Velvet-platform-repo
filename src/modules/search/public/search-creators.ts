import { searchCreators as searchCreatorsRuntime } from "@/modules/search/runtime/search-creators"
import type { SearchCreatorsInput } from "@/modules/search/runtime/search-creators-runtime"

export const PUBLIC_CONTRACT = true

export type { SearchCreatorsInput }

export type SearchCreatorsResult = Awaited<
  ReturnType<typeof searchCreatorsRuntime>
>

export async function searchCreators(
  input: SearchCreatorsInput
): Promise<SearchCreatorsResult> {
  return searchCreatorsRuntime(input)
}
