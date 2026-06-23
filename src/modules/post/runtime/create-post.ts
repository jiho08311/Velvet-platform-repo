import { findCreatorForPostCreate } from "../repositories/post-repository"
import { createCanonicalPost } from "../repositories/post-canonical-write-repository"
import type {
  CreatePostPersistedRowInput,
  Post,
} from "../types"

export async function createPost({
  creatorId,
  title,
  content,
  status = "draft",
  visibility = "subscribers",
  price = 0,
  publishedAt,
}: CreatePostPersistedRowInput): Promise<Post> {
  if (!["draft", "scheduled", "published", "archived"].includes(status)) {
    throw new Error("Invalid post status")
  }

  if (!["public", "subscribers", "paid"].includes(visibility)) {
    throw new Error("Invalid post visibility")
  }

  const creator = await findCreatorForPostCreate(creatorId)

  if (!creator) {
    throw new Error("Only creators can create posts")
  }

  const resolvedPrice = visibility === "paid" ? price : 0

  if (visibility === "paid" && resolvedPrice <= 0) {
    throw new Error("Paid post price must be greater than 0")
  }

  const now = new Date().toISOString()

  const resolvedPublishedAt =
    publishedAt !== undefined
      ? publishedAt
      : status === "published"
        ? now
        : null

  const data = await createCanonicalPost({
    creatorId,
    title,
    content,
    status,
    visibility,
    price: resolvedPrice,
    publishedAt: resolvedPublishedAt,
    createdAt: now,
    updatedAt: now,
  })

  return {
    id: data.id,
    creatorId: data.creator_id,
    title: data.title,
    content: data.content,
    status: data.status,
    visibility: data.visibility,
    price: data.price,
    publishedAt: data.published_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}