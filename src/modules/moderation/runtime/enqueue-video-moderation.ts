import { runVideoModerationQueueRuntime } from "@/modules/moderation/runtime/video-moderation-queue-runtime"
import type { VideoModerationJob } from "@/modules/moderation/contracts/video-moderation-job"

export async function enqueueVideoModeration(input: VideoModerationJob) {
  await runVideoModerationQueueRuntime(input)
}
