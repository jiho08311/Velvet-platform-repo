export type PostStatus = "draft" | "published" | "archived"

export type PostVisibility = "public" | "subscribers" | "paid"

export type Post = {
  id: string
  creatorId: string
  title?: string
  content?: string
  status: PostStatus
  visibility: PostVisibility
  priceCents: number
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export type CreatePostInput = {
  creatorId: string
  title?: string | null
  content?: string | null
  status?: PostStatus
  visibility?: PostVisibility
  priceCents?: number
  publishedAt?: string | null
}