import type {
  CreatePostBlockPersistencePlanItem,
  CreatePostDraftBlock,
  CreatePostDraftInput,
  CreatePostDraftProjection,
  CreatePostMediaCreationPlanItem,
  CreatePostUploadedMediaInput,
  CreatePostUploadedMediaBinding,
} from "../types"
import {
  buildExistingMediaPersistenceItem,
  buildPersistenceCoordinates,
  buildTextPersistenceItem,
  buildUploadedMediaBinding,
  buildUploadedMediaPersistenceItem,
} from "./create-post-persistence-item-builders"
export { resolveCreatePostPersistenceFromProjection } from "./create-post-persistence-resolution-policy"

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

function extractMediaCreationPlanItems(
  blocksToPersist: CreatePostBlockPersistencePlanItem[]
): CreatePostMediaCreationPlanItem[] {
  return blocksToPersist
    .flatMap((item): CreatePostMediaCreationPlanItem[] => {
      if (item.media.kind !== "uploaded") {
        return []
      }

      return [item.media.binding]
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

function isNonEmptyTextBlock(
  block: CreatePostDraftBlock
): block is Extract<CreatePostDraftBlock, { type: "text" }> {
  return block.type === "text" && normalizeText(block.content).length > 0
}

function isUploadedMediaBlock(
  block: CreatePostDraftBlock
): block is Extract<
  CreatePostDraftBlock,
  { type: "image" | "video" | "audio" | "file" }
> & {
  media: {
    kind: "uploaded"
    uploaded: CreatePostUploadedMediaBinding["uploaded"]
  }
} {
  return (
    block.type !== "text" &&
    block.type !== "carousel" &&
    block.media.kind === "uploaded"
  )
}

function isExistingMediaBlock(
  block: CreatePostDraftBlock
): block is Extract<
  CreatePostDraftBlock,
  { type: "image" | "video" | "audio" | "file" }
> & {
  media: { kind: "existing"; mediaId: string }
} {
  return (
    block.type !== "text" &&
    block.type !== "carousel" &&
    block.media.kind === "existing"
  )
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

export function extractCreatePostModerationFiles(params: {
  projection: Pick<CreatePostDraftProjection, "mediaToCreate">
}): CreatePostUploadedMediaInput[] {
  return params.projection.mediaToCreate.map((item) => item.uploaded)
}

/**
 * The only create-time persistence projection builder.
 * This establishes the full persistence contract for:
 * - post content derivation
 * - post_blocks rows
 * - uploaded media creation rows
 * - block-to-media linkage via projection keys and coordinates
 */
function projectCreatePostPersistenceItemsFromDraft(
  draft: Pick<CreatePostDraftInput, "blocks">
): CreatePostBlockPersistencePlanItem[] {
  return draft.blocks
    .flatMap((block): CreatePostBlockPersistencePlanItem[] => {
      if (block.type === "text") {
        const content = normalizeText(block.content)

        if (!content) {
          return []
        }

        return [
          buildTextPersistenceItem({
            content,
            coordinates: buildPersistenceCoordinates({
              blockSortOrder: block.sortOrder,
            }),
            editorState: block.editorState ?? null,
          }),
        ]
      }

      if (block.type === "carousel") {
        const groupId = `carousel-${block.sortOrder}`

        return block.items.flatMap(
          (item, itemIndex): CreatePostBlockPersistencePlanItem[] => {
            const baseEditorState = item.editorState ?? null
            const coordinates = buildPersistenceCoordinates({
              blockSortOrder: block.sortOrder,
              itemIndex,
              carouselGroupId: groupId,
            })

            const carouselMeta = {
              carousel: {
                groupId,
                index: itemIndex,
                size: block.items.length,
              },
            }

            if (item.media.kind === "existing") {
              const mediaId = item.media.mediaId.trim()

              if (!mediaId) {
                return []
              }

              return [
                buildExistingMediaPersistenceItem({
                  type: item.type,
                  mediaId,
                  coordinates,
                  editorState: {
                    ...(baseEditorState ?? {}),
                    ...carouselMeta,
                  },
                }),
              ]
            }

            const uploadedMediaBinding = buildUploadedMediaBinding({
              blockSortOrder: block.sortOrder,
              itemIndex,
              type: item.type,
              uploaded: item.media.uploaded,
              editorState: item.editorState ?? null,
              coordinates,
            })

            return [
              buildUploadedMediaPersistenceItem({
                block: {
                  type: item.type,
                  sortOrder: coordinates.blockSortOrder,
                  editorState: {
                    ...(baseEditorState ?? {}),
                    ...carouselMeta,
                  },
                },
                uploadedMediaBinding,
                coordinates,
              }),
            ]
          }
        )
      }

      if (isExistingMediaBlock(block)) {
        const mediaId = block.media.mediaId.trim()

        if (!mediaId) {
          return []
        }

        return [
          buildExistingMediaPersistenceItem({
            type: block.type,
            mediaId,
            coordinates: buildPersistenceCoordinates({
              blockSortOrder: block.sortOrder,
            }),
            editorState: block.editorState ?? null,
          }),
        ]
      }

      if (isUploadedMediaBlock(block)) {
        const coordinates = buildPersistenceCoordinates({
          blockSortOrder: block.sortOrder,
        })
        const uploadedMediaBinding = buildUploadedMediaBinding({
          blockSortOrder: block.sortOrder,
          type: block.type,
          uploaded: block.media.uploaded,
          editorState: block.editorState ?? null,
          coordinates,
        })

        return [
          buildUploadedMediaPersistenceItem({
            block: {
              type: block.type,
              sortOrder: coordinates.blockSortOrder,
              editorState: block.editorState ?? null,
            },
            uploadedMediaBinding,
            coordinates,
          }),
        ]
      }

      return []
    })
    .sort((a, b) => a.block.sortOrder - b.block.sortOrder)
}

/**
 * Public create projection entrypoint.
 * Downstream workflow code should consume this projection directly rather than
 * rebuilding persistence rules from the raw draft.
 */
export function projectCreatePostDraft(
  draft: Pick<CreatePostDraftInput, "blocks">
): CreatePostDraftProjection {
  const blocksToPersist = projectCreatePostPersistenceItemsFromDraft(draft)
  const mediaToCreate = extractMediaCreationPlanItems(blocksToPersist)

  return {
    content: deriveCreatePostContentFromDraft(draft),
    blocksToPersist,
    mediaToCreate,
  }
}
