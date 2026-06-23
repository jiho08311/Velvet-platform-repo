import { readCreatorIdentityByCreatorId } from "@/modules/identity/public/creator-identity-read-model"
import { readPostPurchaseReadModel } from "@/modules/post/public/post-purchase-read-model"

type CreatePostPurchaseSessionInput = {
  postId: string
  userId: string
}

export type PostPurchasePaymentIntent = {
  postId: string
  userId: string
  creatorId: string
  amount: number
  currency: "KRW"
  orderName: string
}

export async function createPostPurchaseSession({
  postId,
  userId,
}: CreatePostPurchaseSessionInput): Promise<PostPurchasePaymentIntent> {
  const post = await readPostPurchaseReadModel(postId)

  if (post.visibility !== "paid") {
    throw new Error("Post is not purchasable")
  }

  if (post.price <= 0) {
    throw new Error("Post price is invalid")
  }

  const creator = await readCreatorIdentityByCreatorId(post.creator_id)

  if (!creator) {
    throw new Error("Creator not found")
  }

  return {
    postId: post.id,
    userId,
    creatorId: post.creator_id,
    amount: post.price,
    currency: "KRW",
    orderName: "프리미엄 콘텐츠 이용권",
  }
}