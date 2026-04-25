import type {
  ProcessedStoryVideoCreateInput,
  StoryCreatePayload,
  StoryEditorDraft,
  StoryEditorState,
  StoryVideoJobPayload,
} from "../types"
import { normalizeStoryEditorState, normalizeStoryVisibility } from "./story-editor-draft"

export class StoryPayloadValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StoryPayloadValidationError"
  }
}

export function normalizeStoryCreatePayload(
  value?: {
    text?: unknown
    visibility?: unknown
    editorState?: unknown
  } | null
): StoryCreatePayload {
  return {
    text: typeof value?.text === "string" ? value.text.trim() || null : null,
    visibility: normalizeStoryVisibility(value?.visibility),
    editorState: value?.editorState
      ? normalizeStoryEditorState(value.editorState)
      : null,
  }
}

export function buildStoryCreatePayloadFromDraft(
  draft: StoryEditorDraft
): StoryCreatePayload {
  return normalizeStoryCreatePayload({
    visibility: draft.visibility,
    editorState: draft.editorState,
  })
}

function resolveNormalizedStoryCreatePayload(
  story?: {
    text?: unknown
    visibility?: unknown
    editorState?: unknown
  } | null
): StoryCreatePayload {
  return normalizeStoryCreatePayload(story)
}

export function buildStoryCreateRequestBody(params: {
  storagePath: string
  story: StoryCreatePayload
}) {
  return {
    storagePath: params.storagePath,
    ...resolveNormalizedStoryCreatePayload(params.story),
  }
}

function normalizeStoryVideoJobStartTime(value?: unknown): number {
  const resolved = typeof value === "number" ? value : Number(value ?? 0)

  if (!Number.isFinite(resolved)) {
    return 0
  }

  return Math.max(0, resolved)
}

function isVideoStoryStoragePath(value: string) {
  return (
    value.endsWith(".mp4") ||
    value.endsWith(".mov") ||
    value.endsWith(".webm")
  )
}

export function parseStoryCreateRequestBody(value?: {
  storagePath?: unknown
  text?: unknown
  visibility?: unknown
  editorState?: unknown
} | null) {
  if (typeof value?.storagePath !== "string" || !value.storagePath.trim()) {
    throw new StoryPayloadValidationError("Storage path is required")
  }

  if (isVideoStoryStoragePath(value.storagePath)) {
    throw new StoryPayloadValidationError("Use /api/story/video for video upload")
  }

  return {
    storagePath: value.storagePath,
    story: normalizeStoryCreatePayload(value),
  }
}

export function buildStoryVideoJobPayload(params: {
  story?: {
    text?: unknown
    visibility?: unknown
    editorState?: unknown
  } | null
  startTime?: unknown
}): StoryVideoJobPayload {
  const story = resolveNormalizedStoryCreatePayload(params.story)

  return {
    visibility: story.visibility,
    editorState: story.editorState,
    startTime: normalizeStoryVideoJobStartTime(params.startTime),
  }
}

export function buildStoryCreatePayloadFromVideoJob(
  job?: {
    visibility?: unknown
    editorState?: unknown
  } | null
): StoryCreatePayload {
  return resolveNormalizedStoryCreatePayload({
    text: null,
    visibility: job?.visibility,
    editorState: job?.editorState,
  })
}

export function buildProcessedStoryVideoCreateInput(params: {
  creatorId: string
  processedVideoStoragePath: string
  story?: {
    visibility?: unknown
    editorState?: unknown
  } | null
  expiresAt: string
}): ProcessedStoryVideoCreateInput {
  const story = buildStoryCreatePayloadFromVideoJob(params.story)

  return {
    creatorId: params.creatorId,
    processedVideoStoragePath: params.processedVideoStoragePath,
    story: {
      visibility: story.visibility,
      editorState: story.editorState,
    },
    expiresAt: params.expiresAt,
  }
}

export function buildStoryVideoJobPayloadFromDraft(
  draft: StoryEditorDraft
): StoryVideoJobPayload {
  return buildStoryVideoJobPayload({
    story: buildStoryCreatePayloadFromDraft(draft),
    startTime: draft.media.trim.startTime,
  })
}

export function buildStoryVideoJobFormData(params: {
  file: File
  story: StoryVideoJobPayload
  expiresAt?: string | null
}) {
  const formData = new FormData()

  formData.append("file", params.file)
  formData.append("visibility", params.story.visibility)
  formData.append("startTime", String(params.story.startTime))

  if (
    params.story.editorState !== null &&
    typeof params.story.editorState !== "undefined"
  ) {
    formData.append("editorState", JSON.stringify(params.story.editorState))
  }

  if (typeof params.expiresAt === "string" && params.expiresAt.trim()) {
    formData.append("expiresAt", params.expiresAt)
  }

  return formData
}

export function parseStoryVideoJobFormData(formData: FormData) {
  const rawEditorState = formData.get("editorState")
  let parsedEditorState: unknown = null

  if (typeof rawEditorState === "string" && rawEditorState.trim()) {
    try {
      parsedEditorState = JSON.parse(rawEditorState)
    } catch {
      throw new StoryPayloadValidationError("Invalid editorState")
    }
  }

  return {
    file: formData.get("file"),
    expiresAt: String(
      formData.get("expiresAt") ??
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    ),
    story: buildStoryVideoJobPayload({
      story: {
        text: null,
        visibility: formData.get("visibility"),
        editorState: parsedEditorState,
      },
      startTime: formData.get("startTime"),
    }),
  }
}

export function buildStoryInsertValues(params: {
  creatorId: string
  storagePath: string
  story: StoryCreatePayload
  createdAt: string
  expiresAt: string
}) {
  const story = resolveNormalizedStoryCreatePayload(params.story)

  return {
    creator_id: params.creatorId,
    storage_path: params.storagePath,
    text: story.text,
    visibility: story.visibility,
    editor_state: story.editorState,
    created_at: params.createdAt,
    expires_at: params.expiresAt,
    is_deleted: false,
  }
}

export function buildStoryVideoJobInsertValues(params: {
  creatorId: string
  tempStoragePath: string
  story: StoryVideoJobPayload
  expiresAt: string
}) {
  const normalizedStory = resolveNormalizedStoryCreatePayload(params.story)
  const startTime = normalizeStoryVideoJobStartTime(params.story.startTime)

  return {
    creator_id: params.creatorId,
    temp_storage_path: params.tempStoragePath,
    visibility: normalizedStory.visibility,
    start_time: startTime,
    expires_at: params.expiresAt,
    editor_state: normalizedStory.editorState,
    status: "pending" as const,
  }
}
