import type { PostRenderInput } from "@/modules/post/types"

export type CreatorContentTabPost = {
  id: string
  content: string | null
  createdAt: string
  renderInput: PostRenderInput
  media?: Array<{
    id?: string
    url: string
    type?: "image" | "video" | "audio" | "file"
    mimeType?: string | null
    sortOrder?: number
  }>
  canView: boolean
  isLocked?: boolean
  status?: string | null
  visibility?: string | null
  publishedAt?: string | null
}

export type CreatorContentTab = "posts" | "updates"
