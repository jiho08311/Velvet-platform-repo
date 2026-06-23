import {
  enqueueStoryVideoJob as enqueueStoryVideoJobServer,
  getStoryVideoJobForUser as getStoryVideoJobForUserServer,
} from "@/modules/media/services/story-video-job.service"

export const PUBLIC_CONTRACT = true

export type EnqueueStoryVideoJobInput = Parameters<
  typeof enqueueStoryVideoJobServer
>[0]
export type EnqueueStoryVideoJobResult = Awaited<
  ReturnType<typeof enqueueStoryVideoJobServer>
>
export type GetStoryVideoJobForUserInput = Parameters<
  typeof getStoryVideoJobForUserServer
>[0]
export type GetStoryVideoJobForUserResult = Awaited<
  ReturnType<typeof getStoryVideoJobForUserServer>
>

export async function enqueueStoryVideoJob(
  input: EnqueueStoryVideoJobInput
): Promise<EnqueueStoryVideoJobResult> {
  return enqueueStoryVideoJobServer(input)
}

export async function getStoryVideoJobForUser(
  input: GetStoryVideoJobForUserInput
): Promise<GetStoryVideoJobForUserResult> {
  return getStoryVideoJobForUserServer(input)
}
