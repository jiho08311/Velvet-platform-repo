import type { VideoModerationJob } from "@/modules/governance/model/video-moderation-job"
import { enqueueVideoModeration } from "@/modules/moderation/public/video-moderation-orchestration"
import { applyVideoModerationOutcome } from "@/modules/moderation/public/video-moderation-orchestration"
import { runVideoModerationRuntime } from "@/modules/moderation/public/video-moderation-orchestration"

export async function executeRequestVideoModerationRuntime(
  input: VideoModerationJob
) {
  return enqueueVideoModeration(input)
}

export async function executeApplyModerationOutcomeToPostRuntime(
  input: Parameters<typeof applyVideoModerationOutcome>[0]
) {
  return applyVideoModerationOutcome(input)
}

export async function executeProcessVideoModerationJobRuntime(
  input: VideoModerationJob
) {
  return runVideoModerationRuntime(input)
}
