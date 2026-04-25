import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { getCreatorById } from "@/modules/creator/server/get-creator-by-id"
import { getPostById } from "@/modules/post/server/get-post-by-id"
import { getViewerSubscription } from "@/modules/subscription/server/get-viewer-subscription"
import type { PaymentAccessVerification } from "@/modules/payment/types"

type PaymentRow = {
  id: string
  user_id: string
  creator_id: string | null
  type: "subscription" | "tip" | "ppv_message" | "ppv_post"
  status: "pending" | "succeeded" | "failed" | "refunded"
  target_type: "post" | "message" | null
  target_id: string | null
}

type VerifyPaymentAccessAfterSuccessInput = {
  paymentId: string
  viewerUserId: string
}

const ACCESS_VERIFY_ATTEMPTS = 3
const ACCESS_VERIFY_RETRY_DELAY_MS = 250

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function readPayment(paymentId: string): Promise<PaymentRow | null> {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("id, user_id, creator_id, type, status, target_type, target_id")
    .eq("id", paymentId)
    .maybeSingle<PaymentRow>()

  if (error) {
    throw error
  }

  return data
}

export async function verifyPaymentAccessAfterSuccess({
  paymentId,
  viewerUserId,
}: VerifyPaymentAccessAfterSuccessInput): Promise<PaymentAccessVerification> {
  const safePaymentId = paymentId.trim()
  const safeViewerUserId = viewerUserId.trim()

  if (!safePaymentId || !safeViewerUserId) {
    return {
      kind: "payment",
      status: "payment_not_found",
    }
  }

  const payment = await readPayment(safePaymentId)

  if (!payment) {
    return {
      kind: "payment",
      status: "payment_not_found",
    }
  }

  if (payment.user_id !== safeViewerUserId) {
    return {
      kind: "payment",
      status: "viewer_mismatch",
    }
  }

  if (payment.status !== "succeeded") {
    return {
      kind: "payment",
      status: "payment_not_successful",
    }
  }

  if (payment.type === "ppv_post") {
    if (payment.target_type !== "post" || !payment.target_id) {
      return {
        kind: "post",
        status: "missing_target",
        postId: payment.target_id,
      }
    }

    for (let attempt = 1; attempt <= ACCESS_VERIFY_ATTEMPTS; attempt += 1) {
      const post = await getPostById(payment.target_id, safeViewerUserId)

      if (post && !post.isLocked) {
        return {
          kind: "post",
          status: "unlocked",
          postId: payment.target_id,
        }
      }

      if (attempt < ACCESS_VERIFY_ATTEMPTS) {
        await wait(ACCESS_VERIFY_RETRY_DELAY_MS)
      }
    }

    return {
      kind: "post",
      status: "locked",
      postId: payment.target_id,
    }
  }

  if (payment.type === "subscription") {
    if (!payment.creator_id) {
      return {
        kind: "subscription",
        status: "missing_creator",
        creatorId: null,
        creatorUsername: null,
      }
    }

    const creator = await getCreatorById(payment.creator_id)

    if (!creator) {
      return {
        kind: "subscription",
        status: "missing_creator",
        creatorId: payment.creator_id,
        creatorUsername: null,
      }
    }

    for (let attempt = 1; attempt <= ACCESS_VERIFY_ATTEMPTS; attempt += 1) {
      const viewerSubscription = await getViewerSubscription(
        safeViewerUserId,
        payment.creator_id
      )

      if (viewerSubscription.isActive) {
        return {
          kind: "subscription",
          status: "active",
          creatorId: payment.creator_id,
          creatorUsername: creator.username,
        }
      }

      if (attempt < ACCESS_VERIFY_ATTEMPTS) {
        await wait(ACCESS_VERIFY_RETRY_DELAY_MS)
      }
    }

    return {
      kind: "subscription",
      status: "inactive",
      creatorId: payment.creator_id,
      creatorUsername: creator.username,
    }
  }

  return {
    kind: "unsupported",
    status: "not_applicable",
    paymentType: payment.type,
  }
}
