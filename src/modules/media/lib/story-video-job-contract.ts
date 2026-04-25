export type StoryVideoJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"

export const STORY_VIDEO_JOB_POLL_SELECT =
  "id, status, error_message, story_id, created_at, updated_at"

export const STORY_VIDEO_JOB_POLL_FIELDS = [
  "id",
  "status",
  "error_message",
  "story_id",
  "created_at",
  "updated_at",
] as const

export type StoryVideoJobPollRow = {
  id: string
  status: string | null
  error_message: string | null
  story_id: string | null
  created_at: string
  updated_at: string
}

export type StoryVideoJobPollSource = StoryVideoJobPollRow

export type StoryVideoJobCompletionValues = {
  status: "completed"
  story_id: string
  trimmed_storage_path: string
  error_message: null
  locked_at: null
  updated_at: string
}

export type StoryVideoJobFailureValues = {
  status: "failed"
  error_message: string
  locked_at: null
  updated_at: string
}

export type StoryVideoJobPollResponse =
  | {
      jobId: string
      status: "pending"
      isTerminal: false
      storyId: null
      errorMessage: null
      createdAt: string
      updatedAt: string
    }
  | {
      jobId: string
      status: "processing"
      isTerminal: false
      storyId: null
      errorMessage: null
      createdAt: string
      updatedAt: string
    }
  | {
      jobId: string
      status: "completed"
      isTerminal: true
      storyId: string
      errorMessage: null
      createdAt: string
      updatedAt: string
    }
  | {
      jobId: string
      status: "failed"
      isTerminal: true
      storyId: null
      errorMessage: string
      createdAt: string
      updatedAt: string
    }

export type CompletedStoryVideoJobPollResponse = Extract<
  StoryVideoJobPollResponse,
  { status: "completed" }
>

export type FailedStoryVideoJobPollResponse = Extract<
  StoryVideoJobPollResponse,
  { status: "failed" }
>

type StoryVideoJobPollState =
  | {
      kind: "pending"
    }
  | {
      kind: "processing"
    }
  | {
      kind: "completed"
      storyId: string
    }
  | {
      kind: "failed"
      errorMessage: string
    }

function normalizeStoryVideoJobStatus(value: unknown): StoryVideoJobStatus {
  if (value === "completed") {
    return "completed"
  }

  if (value === "failed") {
    return "failed"
  }

  if (value === "pending") {
    return "pending"
  }

  return "processing"
}

function resolveStoryVideoJobPollState(
  row: StoryVideoJobPollRow
): StoryVideoJobPollState {
  const status = normalizeStoryVideoJobStatus(row.status)

  if (status === "completed") {
    if (row.story_id) {
      return {
        kind: "completed",
        storyId: row.story_id,
      }
    }

    // Preserve existing polling behavior until completion metadata is fully visible.
    return {
      kind: "processing",
    }
  }

  if (status === "failed") {
    return {
      kind: "failed",
      errorMessage: row.error_message || "Story video processing failed",
    }
  }

  if (status === "pending") {
    return {
      kind: "pending",
    }
  }

  return {
    kind: "processing",
  }
}

export function buildStoryVideoJobPollResponse(
  row: StoryVideoJobPollRow
): StoryVideoJobPollResponse {
  const state = resolveStoryVideoJobPollState(row)

  if (state.kind === "completed") {
    return {
      jobId: row.id,
      status: "completed",
      isTerminal: true,
      storyId: state.storyId,
      errorMessage: null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  if (state.kind === "failed") {
    return {
      jobId: row.id,
      status: "failed",
      isTerminal: true,
      storyId: null,
      errorMessage: state.errorMessage,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  if (state.kind === "pending") {
    return {
      jobId: row.id,
      status: "pending",
      isTerminal: false,
      storyId: null,
      errorMessage: null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  return {
    jobId: row.id,
    status: "processing",
    isTerminal: false,
    storyId: null,
    errorMessage: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function pickStoryVideoJobPollRow(
  row: StoryVideoJobPollSource
): StoryVideoJobPollRow {
  return {
    id: row.id,
    status: row.status,
    error_message: row.error_message,
    story_id: row.story_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function buildCompletedStoryVideoJobValues(params: {
  storyId: string
  trimmedStoragePath: string
  updatedAt?: string
}): StoryVideoJobCompletionValues {
  return {
    status: "completed",
    story_id: params.storyId,
    trimmed_storage_path: params.trimmedStoragePath,
    error_message: null,
    locked_at: null,
    updated_at: params.updatedAt ?? new Date().toISOString(),
  }
}

export function buildFailedStoryVideoJobValues(params: {
  errorMessage: string
  updatedAt?: string
}): StoryVideoJobFailureValues {
  return {
    status: "failed",
    error_message: params.errorMessage,
    locked_at: null,
    updated_at: params.updatedAt ?? new Date().toISOString(),
  }
}

export function isCompletedStoryVideoJobPollResponse(
  value: StoryVideoJobPollResponse
): value is CompletedStoryVideoJobPollResponse {
  return value.status === "completed" && value.isTerminal && Boolean(value.storyId)
}

export function isFailedStoryVideoJobPollResponse(
  value: StoryVideoJobPollResponse
): value is FailedStoryVideoJobPollResponse {
  return value.status === "failed" && value.isTerminal
}
