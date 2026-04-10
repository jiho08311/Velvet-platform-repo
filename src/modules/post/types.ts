export type PostStatus = "published"

export type PostVisibility =
  | "public"
  | "subscribers"
  | "paid"

export type PostBlockType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "file"

export type PostBlock = {
  id: string
  postId: string
  type: PostBlockType
  content: string | null
  mediaId: string | null
  sortOrder: number
  createdAt: string
}

export type CreatePostBlockInput = {
  type: PostBlockType
  content?: string | null
  mediaId?: string | null
  sortOrder: number
}

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
  blocks?: PostBlock[]
}

export type CreatePostInput = {
  creatorId: string
  title?: string | null
  content?: string | null
  visibility?: PostVisibility
  price?: number
  publishedAt?: string | null
  blocks?: CreatePostBlockInput[]
}