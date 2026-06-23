import { processVideoModeration } from "@/workflows/process-video-moderation"
import type {
  VideoModerationWorkerRuntimeInput,
  VideoModerationWorkerRuntimeResult,
} from "@/modules/moderation/contracts/video-moderation-worker-runtime-contract"

export async function runVideoModerationWorkerRuntime(
  input: VideoModerationWorkerRuntimeInput
): Promise<VideoModerationWorkerRuntimeResult> {
  await processVideoModeration(input.payload)

  return {
    jobId: input.jobId,
    status: "completed",
  }
}
