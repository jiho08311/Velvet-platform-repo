// src/modules/media/public/media-processing-job.ts

import {
  claimMediaProcessingJobRuntime,
  completeMediaProcessingJobRuntime,
  failMediaProcessingJobRuntime,
  queueMediaProcessingJobRuntime,
} from "@/modules/media/runtime/media-processing-job-runtime"

export const PUBLIC_CONTRACT = true

export type MediaProcessingJobContract = Awaited<
  ReturnType<typeof queueMediaProcessingJobRuntime>
>
export type QueueMediaProcessingJobInput = Parameters<
  typeof queueMediaProcessingJobRuntime
>[0]
export type ClaimMediaProcessingJobInput = Parameters<
  typeof claimMediaProcessingJobRuntime
>[0]
export type CompleteMediaProcessingJobInput = Parameters<
  typeof completeMediaProcessingJobRuntime
>[0]
export type FailMediaProcessingJobInput = Parameters<
  typeof failMediaProcessingJobRuntime
>[0]

export function queueMediaProcessingJob(
  input: QueueMediaProcessingJobInput
): Promise<MediaProcessingJobContract> {
  return queueMediaProcessingJobRuntime(input)
}

export function claimMediaProcessingJob(
  input: ClaimMediaProcessingJobInput
): Promise<MediaProcessingJobContract | null> {
  return claimMediaProcessingJobRuntime(input)
}

export function completeMediaProcessingJob(
  input: CompleteMediaProcessingJobInput
): Promise<void> {
  return completeMediaProcessingJobRuntime(input)
}

export function failMediaProcessingJob(
  input: FailMediaProcessingJobInput
): Promise<void> {
  return failMediaProcessingJobRuntime(input)
}
