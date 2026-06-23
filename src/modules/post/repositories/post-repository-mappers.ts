import type {
  CanonicalPostRow,
  CreatorStudioPostDetailRow,
  CreatorStudioPostRow,
  ListCreatorPostsPostRow,
  MyPostsPostRow,
  PostMediaAccessPostRow,
  PostRow,
} from "./post-repository-types"

export function toPostRow(row: CanonicalPostRow): PostRow {
  return {
    id: row.post_id,
    creator_id: row.creator_id,
    title: row.title,
    content: row.content,
    visibility: row.visibility,
    price: row.price,
    status: row.lifecycle_state,
    visibility_status: row.visibility_state,
    moderation_status:
      row.moderation_state === "archived" ? "rejected" : row.moderation_state,
    created_at: row.created_at,
    published_at: row.published_at,
    deleted_at: row.deleted_at,
  }
}

export function toListCreatorPostsPostRow(
  row: CanonicalPostRow,
): ListCreatorPostsPostRow {
  return {
    id: row.post_id,
    creator_id: row.creator_id,
    title: row.title,
    content: row.content,
    status: row.lifecycle_state,
    visibility: row.visibility,
    price: row.price ?? 0,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    visibility_status: row.visibility_state,
    moderation_status:
      row.moderation_state === "archived" ? "rejected" : row.moderation_state,
    deleted_at: row.deleted_at,
  }
}

export function toCreatorStudioPostRow(
  row: CanonicalPostRow
): CreatorStudioPostRow {
  return {
    id: row.post_id,
    creator_id: row.creator_id,
    title: row.title,
    content: row.content,
    status: row.lifecycle_state,
    visibility: row.visibility,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  }
}

export function toCreatorStudioPostDetailRow(
  row: CanonicalPostRow,
): CreatorStudioPostDetailRow {
  return {
    ...toCreatorStudioPostRow(row),
    price: row.price,
  }
}

export function toMyPostsPostRow(row: CanonicalPostRow): MyPostsPostRow {
  return {
    id: row.post_id,
    creator_id: row.creator_id,
    content: row.content,
    status: row.lifecycle_state,
    visibility: row.visibility,
    created_at: row.created_at,
    published_at: row.published_at,
  }
}

export function toPostMediaAccessPostRow(
  row: CanonicalPostRow,
): PostMediaAccessPostRow {
  return {
    id: row.post_id,
    creator_id: row.creator_id,
    visibility: row.visibility,
    price: row.price ?? 0,
    status: row.lifecycle_state,
    visibility_status: row.visibility_state,
    moderation_status:
      row.moderation_state === "archived" ? "rejected" : row.moderation_state,
    published_at: row.published_at,
    deleted_at: row.deleted_at,
  }
}
