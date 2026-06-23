import type {
  CreatePostBlockPersistencePlanItem,
  CreatePostDraftProjectionKey,
  CreatePostPersistenceCoordinates,
  CreatePostUploadedMediaBinding,
} from "../types"

function buildUploadedMediaProjectionKey(params: {
  blockSortOrder: number
  itemIndex?: number
}): CreatePostDraftProjectionKey {
  if (params.itemIndex === undefined) {
    return `block:${params.blockSortOrder}`
  }

  return `carousel:${params.blockSortOrder}:${params.itemIndex}`
}

export function buildUploadedMediaBinding(params: {
  blockSortOrder: number
  type: CreatePostUploadedMediaBinding["type"]
  uploaded: CreatePostUploadedMediaBinding["uploaded"]
  editorState?: CreatePostUploadedMediaBinding["editorState"]
  itemIndex?: number
  coordinates: CreatePostPersistenceCoordinates
}): CreatePostUploadedMediaBinding {
  return {
    projectionKey: buildUploadedMediaProjectionKey({
      blockSortOrder: params.blockSortOrder,
      itemIndex: params.itemIndex,
    }),
    type: params.type,
    sortOrder:
      params.coordinates.mediaSortOrder ?? params.coordinates.blockSortOrder,
    uploaded: params.uploaded,
    editorState: params.editorState ?? null,
    coordinates: params.coordinates,
  }
}

export function buildUploadedMediaPersistenceItem(params: {
  block: CreatePostBlockPersistencePlanItem["block"]
  uploadedMediaBinding: CreatePostUploadedMediaBinding
  coordinates: CreatePostPersistenceCoordinates
}): CreatePostBlockPersistencePlanItem {
  return {
    kind: "uploaded-media",
    block: params.block,
    media: {
      kind: "uploaded",
      binding: params.uploadedMediaBinding,
    },
    coordinates: params.coordinates,
  }
}

export function buildPersistenceCoordinates(params: {
  blockSortOrder: number
  itemIndex?: number
  carouselGroupId?: string
}): CreatePostPersistenceCoordinates {
  return {
blockSortOrder: params.blockSortOrder,
mediaSortOrder: params.blockSortOrder,
    carouselGroupId: params.carouselGroupId ?? null,
    carouselItemIndex: params.itemIndex ?? null,
  }
}

export function buildTextPersistenceItem(params: {
  content: string
  coordinates: CreatePostPersistenceCoordinates
  editorState?: CreatePostBlockPersistencePlanItem["block"]["editorState"]
}): CreatePostBlockPersistencePlanItem {
  return {
    kind: "text",
    block: {
      type: "text",
      content: params.content,
      sortOrder: params.coordinates.blockSortOrder,
      editorState: params.editorState ?? null,
    },
    media: {
      kind: "none",
    },
    coordinates: params.coordinates,
  }
}

export function buildExistingMediaPersistenceItem(params: {
  type: Exclude<
    CreatePostBlockPersistencePlanItem["block"]["type"],
    "text" | "carousel"
  >
  mediaId: string
  coordinates: CreatePostPersistenceCoordinates
  editorState?: CreatePostBlockPersistencePlanItem["block"]["editorState"]
}): CreatePostBlockPersistencePlanItem {
  return {
    kind: "existing-media",
    block: {
      type: params.type,
      mediaId: params.mediaId,
      sortOrder: params.coordinates.blockSortOrder,
      editorState: params.editorState ?? null,
    },
    media: {
      kind: "existing",
      mediaId: params.mediaId,
    },
    coordinates: params.coordinates,
  }
}
