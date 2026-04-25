import type {
  StoryCreatePayload,
  StoryEditorDraft,
  StoryEditorState,
  StoryMediaType,
  StoryVideoTrim,
  StoryVisibility,
} from "../types"

const DEFAULT_STORY_VISIBILITY: StoryVisibility = "subscribers"

export function normalizeStoryVisibility(
  value?: unknown
): StoryVisibility {
  return value === "public" ? "public" : DEFAULT_STORY_VISIBILITY
}

export function createEmptyStoryEditorState(): StoryEditorState {
  return {
    textOverlays: [],
    overlays: [],
    filter: null,
    music: null,
  }
}

export function createEmptyStoryVideoTrim(): StoryVideoTrim {
  return {
    duration: 0,
    requiresTrim: false,
    startTime: 0,
    endTime: 0,
  }
}

export function getStoryMediaTypeFromFile(
  file: File | null | undefined
): StoryMediaType | null {
  if (!file) {
    return null
  }

  if (file.type.startsWith("image/")) {
    return "image"
  }

  if (file.type.startsWith("video/")) {
    return "video"
  }

  return null
}

export function normalizeStoryVideoTrim(
  value?: Partial<StoryVideoTrim> | null
): StoryVideoTrim {
  const duration = Number.isFinite(value?.duration) ? Math.max(0, value!.duration!) : 0
  const startTime = Number.isFinite(value?.startTime)
    ? Math.max(0, value!.startTime!)
    : 0
  const endTime = Number.isFinite(value?.endTime)
    ? Math.max(startTime, value!.endTime!)
    : Math.max(startTime, duration)
  const requiresTrim =
    typeof value?.requiresTrim === "boolean"
      ? value.requiresTrim
      : duration > 10

  return {
    duration,
    requiresTrim,
    startTime,
    endTime,
  }
}

export function normalizeStoryEditorState(
  value?: StoryEditorState | null
): StoryEditorState {
  return {
    textOverlays: value?.textOverlays ?? [],
    overlays: value?.overlays ?? [],
    filter: value?.filter ?? null,
    music: value?.music ?? null,
  }
}

export function normalizeStoryEditorDraft(
  value?: Partial<StoryEditorDraft> | null
): StoryEditorDraft {
  const file = value?.media?.file ?? null

  return {
    media: {
      type: value?.media?.type ?? getStoryMediaTypeFromFile(file),
      file,
      trim: normalizeStoryVideoTrim(value?.media?.trim),
    },
    visibility: normalizeStoryVisibility(value?.visibility),
    editorState: normalizeStoryEditorState(value?.editorState),
  }
}

export type { StoryCreatePayload } from "../types"
export {
  buildStoryCreatePayloadFromVideoJob,
  buildStoryInsertValues,
  buildStoryCreatePayloadFromDraft,
  buildStoryCreateRequestBody,
  buildStoryVideoJobInsertValues,
  buildStoryVideoJobFormData,
  buildStoryVideoJobPayload,
  buildStoryVideoJobPayloadFromDraft,
  normalizeStoryCreatePayload,
  parseStoryVideoJobFormData,
  parseStoryCreateRequestBody,
  StoryPayloadValidationError,
} from "./story-create-payload"
