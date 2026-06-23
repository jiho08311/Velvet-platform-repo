export type PostStatus = "draft" | "scheduled" | "published" | "archived"

export type PostVisibility = "public" | "subscribers" | "paid"

export type PostAccessLockReason = "none" | "subscription" | "purchase"

export type PostPurchaseBlockingReason =
  | "not_paid_post"
  | "invalid_price"
  | "owner"
  | "already_purchased"
  | "subscribed"

export type PostPurchaseEligibility =
  | {
      canPurchase: true
      blockingReason: null
    }
  | {
      canPurchase: false
      blockingReason: PostPurchaseBlockingReason
    }

export type PostCommerceState = {
  purchaseEligibility: PostPurchaseEligibility
  hasPurchased: boolean
  isSubscribed: boolean
}

export type PostLockedPreviewVariant = Exclude<PostAccessLockReason, "none">

export type PostAccessResult = {
  canView: boolean
  isLocked: boolean
  lockReason: PostAccessLockReason
}

export type PostBlockType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "carousel"

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
  carousel?: {
    groupId: string
    index: number
    size: number
  }
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

export type CreatePostPersistedBlockRowInput = CreatePostBlockInput

export type PersistedPostEditorBlockInput = {
  type: Exclude<PostBlockType, "carousel">
  content?: string | null
  sortOrder: number
  mediaId?: string | null
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

export type CreatePostPersistedRowInput = {
  creatorId: string
  title?: string | null
  content?: string | null
  status?: PostStatus
  visibility?: PostVisibility
  price?: number
  publishedAt?: string | null
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

export type CommentRow = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
}
