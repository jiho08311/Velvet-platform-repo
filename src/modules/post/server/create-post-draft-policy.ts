import type {
  CreatePostBlockInput,
  CreatePostDraftBlock,
  CreatePostDraftInput,
  CreatePostDraftProjection,
  CreatePostPersistedMediaDraftItem,
} from "../types"

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

function isNonEmptyTextBlock(
  block: CreatePostDraftBlock
): block is Extract<CreatePostDraftBlock, { type: "text" }> {
  return block.type === "text" && normalizeText(block.content).length > 0
}

function isUploadedMediaBlock(
  block: CreatePostDraftBlock
): block is Extract<CreatePostDraftBlock, { type: "image" | "video" | "audio" | "file" }> & {
  media: { kind: "uploaded"; uploaded: CreatePostPersistedMediaDraftItem["uploaded"] }
} {
  return block.type !== "text" && block.media.kind === "uploaded"
}

function isExistingMediaBlock(
  block: CreatePostDraftBlock
): block is Extract<CreatePostDraftBlock, { type: "image" | "video" | "audio" | "file" }> & {
  media: { kind: "existing"; mediaId: string }
} {
  return block.type !== "text" && block.media.kind === "existing"
}

export function deriveCreatePostContentFromDraft(
  draft: Pick<CreatePostDraftInput, "blocks">
): string | null {
  const content = draft.blocks
    .filter(isNonEmptyTextBlock)
    .map((block) => normalizeText(block.content))
    .join("\n\n")
    .trim()

  return content.length > 0 ? content : null
}

export function extractUploadedMediaFromCreatePostDraft(
  draft: Pick<CreatePostDraftInput, "blocks">
): CreatePostPersistedMediaDraftItem[] {
  return draft.blocks
    .filter(isUploadedMediaBlock)
    .map((block) => ({
      type: block.type,
      sortOrder: block.sortOrder,
      uploaded: block.media.uploaded,
      editorState: block.editorState ?? null,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function projectCreatePostBlocksFromDraft(
  draft: Pick<CreatePostDraftInput, "blocks">
): CreatePostBlockInput[] {
  return draft.blocks
    .flatMap((block): CreatePostBlockInput[] => {
      if (block.type === "text") {
        const content = normalizeText(block.content)

        if (!content) {
          return []
        }

        return [
          {
            type: "text",
            content,
            sortOrder: block.sortOrder,
            editorState: block.editorState ?? null,
          },
        ]
      }

      if (isExistingMediaBlock(block)) {
        const mediaId = block.media.mediaId.trim()

        if (!mediaId) {
          return []
        }

        return [
          {
            type: block.type,
            mediaId,
            sortOrder: block.sortOrder,
            editorState: block.editorState ?? null,
          },
        ]
      }

      if (isUploadedMediaBlock(block)) {
        return [
          {
            type: block.type,
            sortOrder: block.sortOrder,
            editorState: block.editorState ?? null,
          },
        ]
      }

      return []
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function projectCreatePostDraft(
  draft: Pick<CreatePostDraftInput, "blocks">
): CreatePostDraftProjection {
  return {
    content: deriveCreatePostContentFromDraft(draft),
    media: extractUploadedMediaFromCreatePostDraft(draft),
    blocks: projectCreatePostBlocksFromDraft(draft),
  }
}