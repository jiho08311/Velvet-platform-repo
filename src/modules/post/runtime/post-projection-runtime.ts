import { serveMediaUrl } from "@/modules/media/serving"
import { buildPostRenderInput } from "@/modules/post/mappers/post-render-input"
import { buildLockedPreviewPolicy } from "@/modules/post/policies/locked-preview-policy"
import { buildPostRenderReadModel } from "@/modules/post/mappers/post-render-read-model"
import type {
  PostAccessResult,
  PostBlockEditorState,
  PostRenderInput,
  PostRenderMediaItem,
} from "@/modules/post/types"

export type PostProjectionRuntimeSurface =
  | "post_detail_projection"
  | "creator_post_list_projection"
  | "creator_page_projection"
  | "feed_projection"
  | "discovery_projection"

type ProjectionRuntimePrimitive =
  | string
  | number
  | boolean
  | null
  | undefined

type ProjectionRuntimeRecord = Record<string, ProjectionRuntimePrimitive>

export type PostProjectionRuntimeBlock = {
  id: string
  postId: string
  type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  mediaId: string | null
  sortOrder: number
  createdAt: string
  editorState: PostBlockEditorState | null
}

export type PostProjectionRuntimeMediaRow = {
  id: string
  post_id: string
  storage_path: string
  type: "image" | "video" | "audio" | "file" | string | null
  mime_type: string | null
  sort_order: number | null
}

export type SignedPostProjectionRuntimeMedia = {
  id: string
  url: string
  type: "image" | "video" | "audio" | "file"
  mimeType: string | null
  sortOrder?: number
}

export type AssemblePostProjectionRuntimeInput = {
  sourceFile: string
  sourceSymbol: string
  surface: PostProjectionRuntimeSurface
  post: {
    id: string
    creatorId: string
    content: string | null
    visibility: "public" | "subscribers" | "paid"
  }
  access: PostAccessResult
  publicState: "hidden" | "upcoming" | "published"
  viewerUserId: string | null
  creatorUserId: string
  isSubscribed: boolean
  hasPurchased: boolean
  blocks: PostProjectionRuntimeBlock[]
  mediaRows: PostProjectionRuntimeMediaRow[]
  correlationKeys?: ProjectionRuntimeRecord
  metadata?: ProjectionRuntimeRecord
}

export type PostProjectionRuntimeResult = {
  previewPolicy: ReturnType<typeof buildLockedPreviewPolicy>
  selectedBlocks: PostProjectionRuntimeBlock[]
  selectedMedia: SignedPostProjectionRuntimeMedia[]
  renderInput: PostRenderInput
  lineage: {
    selectedBlockIds: string[]
    selectedMediaIds: string[]
    renderInputSignalIds: string[]
    capabilitySignalIds: string[]
  }
}

function resolveMediaType(
  row: PostProjectionRuntimeMediaRow,
): SignedPostProjectionRuntimeMedia["type"] {
  if (
    row.type === "image" ||
    row.type === "video" ||
    row.type === "audio" ||
    row.type === "file"
  ) {
    return row.type
  }

  if (typeof row.mime_type === "string") {
    if (row.mime_type.startsWith("image/")) return "image"
    if (row.mime_type.startsWith("video/")) return "video"
    if (row.mime_type.startsWith("audio/")) return "audio"
  }

  return "file"
}

function mapPreviewMedia(
  mediaRows: PostProjectionRuntimeMediaRow[],
): PostRenderMediaItem[] {
  return mediaRows.map((item) => ({
    id: item.id,
    url: "",
    type: resolveMediaType(item),
    mimeType: item.mime_type,
    sortOrder: item.sort_order ?? undefined,
  }))
}

function sortMediaRows(rows: PostProjectionRuntimeMediaRow[]) {
  return [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}

export async function assemblePostProjectionRuntime(
  input: AssemblePostProjectionRuntimeInput,
): Promise<PostProjectionRuntimeResult> {
  const sortedBlocks = [...input.blocks].sort((a, b) => a.sortOrder - b.sortOrder)
  const sortedMediaRows = sortMediaRows(input.mediaRows)






  const previewPolicy = buildLockedPreviewPolicy({
    access: input.access,
    publicState: input.publicState,
    text: input.post.content ?? "",
    blocks: sortedBlocks,
    media: mapPreviewMedia(sortedMediaRows),
  })

  const selectedMediaRows = input.access.canView
    ? sortedMediaRows
    : sortedMediaRows.filter((item) =>
        previewPolicy.previewMedia.some((preview) => preview.id === item.id),
      )

  const selectedMedia: SignedPostProjectionRuntimeMedia[] = await Promise.all(
    selectedMediaRows.map(async (item) => ({
      id: item.id,
      url:
        (await serveMediaUrl({
          storagePath: item.storage_path,
          viewerUserId: input.viewerUserId,
          creatorUserId: input.creatorUserId,
          visibility: input.post.visibility,
          canView: input.access.canView,
          isSubscribed: input.isSubscribed,
          hasPurchased: input.hasPurchased,
          allowPreview:
            !input.access.canView && previewPolicy.allowPreviewMediaSigning,
        })) ?? "",
      type: resolveMediaType(item),
      mimeType: item.mime_type,
      sortOrder: item.sort_order ?? undefined,
    })),
  )

  const selectedBlocks = input.access.canView
    ? sortedBlocks
    : previewPolicy.previewBlocks

  const renderReadModel = buildPostRenderReadModel({
    blockRows: selectedBlocks.map((block) => ({
      id: block.id,
      post_id: block.postId,
      type: block.type,
      content: block.content,
      media_id: block.mediaId,
      sort_order: block.sortOrder,
      created_at: block.createdAt,
      editor_state: block.editorState ?? null,
    })),
    mediaItems: selectedMedia,
  })

  const renderInput = buildPostRenderInput({
    text: input.access.canView
      ? input.post.content ?? ""
      : previewPolicy.renderTextSeed,
    blocks: renderReadModel.blocks,
    media: renderReadModel.media,
  })

  const selectedBlockIds = renderReadModel.blocks.map((block) => block.id)
  const selectedMediaIds = selectedMedia.map((item) => item.id)
  const renderInputSignalIds = [input.post.id]
  const capabilitySignalIds = selectedMediaIds

  return {
    previewPolicy,
    selectedBlocks,
    selectedMedia,
    renderInput,
    lineage: {
      selectedBlockIds,
      selectedMediaIds,
      renderInputSignalIds,
      capabilitySignalIds,
    },
  }
}