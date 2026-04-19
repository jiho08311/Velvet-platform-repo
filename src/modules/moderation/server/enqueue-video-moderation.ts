import { videoModerationQueue } from "./video-moderation-queue"
import type { VideoModerationJob } from "./video-moderation-job"

export async function enqueueVideoModeration(input: VideoModerationJob) {
  await videoModerationQueue.add("process-video", input, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  })
}