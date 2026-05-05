import {
  enqueueStoryVideoJob as enqueueStoryVideoJobServer,
  getStoryVideoJobForUser as getStoryVideoJobForUserServer,
} from "@/modules/media/server/story-video-job.service"

export async function enqueueStoryVideoJob(
  input: Parameters<typeof enqueueStoryVideoJobServer>[0]
) {
  return enqueueStoryVideoJobServer(input)
}

export async function getStoryVideoJobForUser(
  input: Parameters<typeof getStoryVideoJobForUserServer>[0]
) {
  return getStoryVideoJobForUserServer(input)
}
