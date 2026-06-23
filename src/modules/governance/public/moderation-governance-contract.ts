import type {
  RecordModerationDecisionInput,
  RequestModerationCaseInput,
} from "@/modules/governance/model/moderation-case"
import type { VideoModerationJob } from "@/modules/governance/model/video-moderation-job"
import {
  executeFindLatestModerationCaseByTargetRuntime,
  executeListModerationCasesRuntime,
  executeRecordModerationDecisionRuntime,
  executeRequestModerationCaseRuntime,
} from "@/modules/governance/runtime/moderation-governance-runtime"
import {
  executeApplyModerationOutcomeToPostRuntime,
  executeProcessVideoModerationJobRuntime,
  executeRequestVideoModerationRuntime,
} from "@/modules/governance/runtime/moderation-job-governance-runtime"

export const PUBLIC_CONTRACT = true

export type {
  RecordModerationDecisionInput,
  RequestModerationCaseInput,
  VideoModerationJob,
}

export async function requestModerationCase(input: RequestModerationCaseInput) {
  return executeRequestModerationCaseRuntime(input)
}

export async function listModerationCases() {
  return executeListModerationCasesRuntime()
}

export async function recordModerationDecision(
  input: RecordModerationDecisionInput
) {
  return executeRecordModerationDecisionRuntime(input)
}

export async function findLatestModerationCaseByTarget(input: {
  targetType: string
  targetId: string
}) {
  return executeFindLatestModerationCaseByTargetRuntime(input)
}

export async function requestVideoModeration(input: VideoModerationJob) {
  return executeRequestVideoModerationRuntime(input)
}

export async function applyModerationOutcomeToPost(
  input: Parameters<typeof executeApplyModerationOutcomeToPostRuntime>[0]
) {
  return executeApplyModerationOutcomeToPostRuntime(input)
}

export async function processVideoModerationJob(input: VideoModerationJob) {
  return executeProcessVideoModerationJobRuntime(input)
}
