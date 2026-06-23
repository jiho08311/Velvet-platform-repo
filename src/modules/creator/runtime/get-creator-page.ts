import {
  getCreatorPageRuntime,
  type GetCreatorPageInput,
} from "@/modules/creator/runtime/get-creator-page-runtime"

export async function getCreatorPage(input: GetCreatorPageInput) {
  return getCreatorPageRuntime(input)
}
