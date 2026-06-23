import {
  executeScheduledPostPublicationRuntime as executeScheduledPostPublication,
} from "@/modules/post/runtime/execute-scheduled-post-publication-runtime"

export const PUBLIC_CONTRACT = true

export async function executeScheduledPostPublicationRuntime(): Promise<void> {
  return executeScheduledPostPublication()
}
