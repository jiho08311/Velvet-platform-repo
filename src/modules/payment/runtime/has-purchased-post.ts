import { canPaymentUnlockAccess } from "@/modules/payment/policies/payment-status-policy"
import { findSucceededPpvPostPayment } from "@/modules/payment/repositories/payment-read-repository"

type HasPurchasedPostParams = {
  userId: string
  postId: string
}

export async function hasPurchasedPost({
  userId,
  postId,
}: HasPurchasedPostParams): Promise<boolean> {
  const safeUserId = userId.trim()
  const safePostId = postId.trim()

  if (!safeUserId || !safePostId) {
    return false
  }

  const data = await findSucceededPpvPostPayment({
    userId: safeUserId,
    postId: safePostId,
  })

  if (!data) {
    return false
  }

  return canPaymentUnlockAccess(data.status)
}