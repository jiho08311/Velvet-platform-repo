import { updateCanonicalPost } from "@/modules/post/repositories/post-canonical-write-repository"

type UpdatePostInput = {
  postId: string
  creatorId: string
  title?: string | null
  content?: string | null
  status?: "draft" | "scheduled" | "published" | "archived"
  visibility?: "public" | "subscribers" | "paid"
  price?: number
  publishedAt?: string | null
}

export async function updatePost({
  postId,
  creatorId,
  title,
  content,
  status,
  visibility,
  price,
  publishedAt,
}: UpdatePostInput): Promise<{
  id: string
  creatorId: string
  title?: string
  content?: string
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  price: number
  publishedAt?: string
  createdAt: string
  updatedAt: string
}> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (title !== undefined) updateData.title = title
  if (content !== undefined) updateData.content = content

  if (status !== undefined) {
    if (!["draft", "scheduled", "published", "archived"].includes(status)) {
      throw new Error("Invalid post status")
    }

    updateData.status = status
  }

  if (visibility !== undefined) {
    if (!["public", "subscribers", "paid"].includes(visibility)) {
      throw new Error("Invalid post visibility")
    }

    updateData.visibility = visibility
  }

  if (price !== undefined) updateData.price = price
  if (publishedAt !== undefined) updateData.published_at = publishedAt

  const data = await updateCanonicalPost({
    postId,
    creatorId,
    updateData,
  })

  return {
    id: data.id,
    creatorId: data.creator_id,
    title: data.title ?? undefined,
    content: data.content ?? undefined,
    status: data.status,
    visibility: data.visibility,
    price: data.price,
    publishedAt: data.published_at ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}