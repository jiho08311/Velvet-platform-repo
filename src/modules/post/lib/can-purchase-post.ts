import type { Post, PostPurchaseEligibility } from "../types"

type CanPurchasePostParams = {
  post: Post
  isOwner: boolean
  hasPurchased: boolean
  isSubscribed: boolean
}

export function getPostPurchaseEligibility({
  post,
  isOwner,
  hasPurchased,
  isSubscribed,
}: CanPurchasePostParams): PostPurchaseEligibility {
  if (post.visibility !== "paid") {
    return {
      canPurchase: false,
      blockingReason: "not_paid_post",
    }
  }

  if (post.price <= 0) {
    return {
      canPurchase: false,
      blockingReason: "invalid_price",
    }
  }

  if (isOwner) {
    return {
      canPurchase: false,
      blockingReason: "owner",
    }
  }

  if (hasPurchased) {
    return {
      canPurchase: false,
      blockingReason: "already_purchased",
    }
  }

  if (isSubscribed) {
    return {
      canPurchase: false,
      blockingReason: "subscribed",
    }
  }

  return {
    canPurchase: true,
    blockingReason: null,
  }
}

export function canPurchasePost(input: CanPurchasePostParams): boolean {
  return getPostPurchaseEligibility(input).canPurchase
}
