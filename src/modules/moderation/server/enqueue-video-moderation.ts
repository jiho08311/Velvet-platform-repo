import { videoModerationQueue } from "./video-moderation-queue"

export async function enqueueVideoModeration(input: {
  postId: string
  media: Array<{
    id: string
    type: string
    storagePath: string
  }>
}) {
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