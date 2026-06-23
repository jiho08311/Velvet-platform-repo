import {
  processStoryVideoJob as processStoryVideo,
} from "@/modules/media/workers/story-video-processor"

export const PUBLIC_CONTRACT = true

export type ProcessStoryVideoJobInput = Parameters<typeof processStoryVideo>[0]
export type ProcessStoryVideoJobResult = Awaited<
  ReturnType<typeof processStoryVideo>
>

export async function processStoryVideoJob(
  input: ProcessStoryVideoJobInput
): Promise<ProcessStoryVideoJobResult> {
  return processStoryVideo(input)
}
