import { hasPurchasedPost } from "@/modules/payment/public/has-purchased-post"
import { checkSubscription } from "@/modules/subscription/public/check-subscription"

export async function checkCanonicalCreatorAccess(input: {
  viewerUserId: string
  creatorId: string
}) {
  return checkSubscription({
    userId: input.viewerUserId,
    creatorId: input.creatorId,
  })
}

export async function checkCanonicalPostPurchase(input: {
  viewerUserId: string
  postId: string
}) {
  return hasPurchasedPost({
    userId: input.viewerUserId,
    postId: input.postId,
  })
}
