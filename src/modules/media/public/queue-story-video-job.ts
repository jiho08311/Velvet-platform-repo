import {
  queueStoryVideoJob as queueStoryVideoJobRuntime,
  waitForStoryVideoJob as waitForStoryVideoJobRuntime,
} from "@/modules/media/runtime/queue-story-video-job"

export const PUBLIC_CONTRACT = true

export type QueueStoryVideoJobInput = Parameters<typeof queueStoryVideoJobRuntime>[0]
export type QueueStoryVideoJobResult = Awaited<
  ReturnType<typeof queueStoryVideoJobRuntime>
>
export type WaitForStoryVideoJobInput = Parameters<
  typeof waitForStoryVideoJobRuntime
>[0]
export type WaitForStoryVideoJobResult = Awaited<
  ReturnType<typeof waitForStoryVideoJobRuntime>
>

export async function queueStoryVideoJob(
  input: QueueStoryVideoJobInput
): Promise<QueueStoryVideoJobResult> {
  return queueStoryVideoJobRuntime(input)
}

export async function waitForStoryVideoJob(
  input: WaitForStoryVideoJobInput
): Promise<WaitForStoryVideoJobResult> {
  return waitForStoryVideoJobRuntime(input)
}
