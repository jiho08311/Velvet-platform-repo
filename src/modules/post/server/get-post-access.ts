import { resolvePostAccessPolicy } from "@/modules/post/policies/post-access-policy"
import type { PostAccessResult } from "../types"

type GetPostAccessInput = {
  viewerUserId: string | null
  post: {
    id: string
    creatorId: string
    content?: string
    visibility: "public" | "subscribers" | "paid"
    price: number
    createdAt: string
  }
  creator: {
    userId: string
  }
  isSubscribedResult: boolean
  hasPurchasedResult: boolean
}

export async function getPostAccess({
  viewerUserId,
  post,
  creator,
  isSubscribedResult,
  hasPurchasedResult,
}: GetPostAccessInput): Promise<PostAccessResult> {
  return resolvePostAccessPolicy({
    viewerUserId,
    creatorUserId: creator.userId,
    visibility: post.visibility,
    isSubscribed: isSubscribedResult,
    hasPurchased: hasPurchasedResult,
  })
}