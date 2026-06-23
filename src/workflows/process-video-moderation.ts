import type { VideoModerationJob } from "@/modules/governance/model/video-moderation-job"
import { processVideoModerationJob } from "@/modules/governance/public/moderation-governance-contract"

export async function processVideoModeration(input: VideoModerationJob) {
  return processVideoModerationJob(input)
}
