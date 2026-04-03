export type PostStatus = "published"

export type PostVisibility =
  | "public"
  | "subscribers"
  | "paid"

export type Post = {
  id: string
  creatorId: string
  title: string | null
  content: string | null
  status: PostStatus
  visibility: PostVisibility
  price: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CreatePostInput = {
  creatorId: string
  title?: string | null
  content?: string | null
  visibility?: PostVisibility
  price?: number
  publishedAt?: string | null
}