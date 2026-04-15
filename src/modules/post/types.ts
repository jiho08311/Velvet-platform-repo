export type PostStatus = "draft" | "scheduled" | "published" | "archived"

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

export type PostBlockImageOverlayText = {
  text: string
  x: number
  y: number
  color: string
  fontSize: "sm" | "md" | "lg"
  scale: number
}

export type PostImageBlockEditorState = {
  filter: "none" | "warm" | "cool" | "mono" | "vivid"
  overlayText: PostBlockImageOverlayText | null
}

export type PostVideoBlockEditorState = {
  trimStart: number
  trimEnd: number | null
  muted: boolean
}

export type PostBlockEditorState = {
  image?: PostImageBlockEditorState
  video?: PostVideoBlockEditorState
} | null

export type PostBlock = {
  id: string
  postId: string
  type: PostBlockType
  content: string | null
  mediaId: string | null
  sortOrder: number
  createdAt: string
  editorState: PostBlockEditorState
}

export type CreatePostBlockInput = {
  type: PostBlockType
  content?: string | null
  mediaId?: string | null
  sortOrder: number
  editorState?: PostBlockEditorState
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
  status?: PostStatus
  visibility?: PostVisibility
  price?: number
  publishedAt?: string | null
  blocks?: CreatePostBlockInput[]
}