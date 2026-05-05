import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type {
  StoryEditorState,
  StoryVisibility,
} from "@/modules/story/types"
import type {
  StoryVideoJobCompletionValues,
  StoryVideoJobFailureValues,
  StoryVideoJobPollSource,
  StoryVideoJobStatus,
} from "@/modules/media/lib/story-video-job-contract"

export type StoryVideoJobRow = {
  id: string
  creator_id: string
  temp_storage_path: string
  trimmed_storage_path: string | null
  story_id: string | null
  visibility: StoryVisibility
  start_time: number
  expires_at: string
  editor_state: StoryEditorState | null
  status: StoryVideoJobStatus
  attempts: number
  error_message: string | null
  locked_at: string | null
  created_at: string
  updated_at: string
}

export type StoryVideoJobInsertValues = {
  creator_id: string
  temp_storage_path: string
  visibility: StoryVisibility
  start_time: number
  expires_at: string
  editor_state: StoryEditorState | null
  status: "pending"
}

export async function insertStoryVideoJobRow(
  insertValues: StoryVideoJobInsertValues
): Promise<StoryVideoJobRow> {
  const { data, error } = await supabaseAdmin
    .from("story_video_jobs")
    .insert(insertValues)
    .select("*")
    .single<StoryVideoJobRow>()

  if (error || !data) {
    throw new Error(error?.message || "Failed to create job")
  }

  return data
}

export async function claimStoryVideoJobRow(): Promise<StoryVideoJobRow | null> {
  const { data, error } = await supabaseAdmin.rpc("claim_story_video_job")

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  return data as StoryVideoJobRow
}

export async function updateStoryVideoJobCompletedRow(params: {
  jobId: string
  values: StoryVideoJobCompletionValues
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("story_video_jobs")
    .update(params.values)
    .eq("id", params.jobId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function updateStoryVideoJobFailedRow(params: {
  jobId: string
  values: StoryVideoJobFailureValues
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("story_video_jobs")
    .update(params.values)
    .eq("id", params.jobId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function findStoryVideoJobPollRowForCreator(params: {
  jobId: string
  creatorId: string
  selectColumns: string
}): Promise<StoryVideoJobPollSource> {
  const { data, error } = await supabaseAdmin
    .from("story_video_jobs")
    .select(params.selectColumns)
    .eq("id", params.jobId)
    .eq("creator_id", params.creatorId)
    .single<StoryVideoJobPollSource>()

  if (error || !data) {
    throw new Error("Job not found")
  }

  return data
}
