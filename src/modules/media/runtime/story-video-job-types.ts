import type { StoryVideoJobPayload } from "@/modules/story/types"
import type { StoryVideoProcessorInput } from "@/modules/media/contracts/story-video-processor-contract"

export type StoryVideoJob = {
  id: string
  creator_id: string
  temp_storage_path: string
  trimmed_storage_path: string | null
  story_id: string | null
  visibility: StoryVideoJobPayload["visibility"]
  start_time: number
  expires_at: string
  editor_state: StoryVideoJobPayload["editorState"] | null
  status: string
  attempts: number
  error_message: string | null
  locked_at: string | null
  created_at: string
  updated_at: string
}

export type ClaimedStoryVideoJob = {
  processorInput: StoryVideoProcessorInput
}
