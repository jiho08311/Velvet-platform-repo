export type PostId = string
export type PostCreatorId = string

export type PostVisibility =
  | "public"
  | "subscribers"

export type Post = {
  id: PostId
  creatorId: PostCreatorId
  text: string
  visibility: PostVisibility
  isLocked: boolean
  price: number | null
  createdAt: string
}