import {
  issueContentAccessGrant,
} from "@/modules/entitlement/public/access-grants"
import { readCreatorIdentityByCreatorId } from "@/modules/identity/public/creator-identity-read-model"
import {
  emitPaymentConfirmedNotificationEvent,
} from "@/modules/payment/events/payment-domain-events"
import {
  findExistingPpvPostPayment,
} from "@/modules/payment/repositories/payment-read-repository"
import {
  insertSucceededMockPpvPostPayment,
} from "@/modules/payment/repositories/payment-write-repository"
import { InfrastructureError } from "@/shared/errors"

type CreatePpvPostPaymentInput = {
  userId: string
  creatorId: string
  postId: string
  amount: number
  currency: string
}

export async function createPpvPostPayment({
  userId,
  creatorId,
  postId,
  amount,
  currency,
}: CreatePpvPostPaymentInput) {
  const existing = await findExistingPpvPostPayment({
    userId,
    postId,
  })

  if (existing) {
    await issueContentAccessGrant({
      viewerUserId: userId,
      creatorId,
      postId,
      paymentId: existing.id,
      grantedAt: new Date().toISOString(),
      sourceType: "ppv_post_existing_payment",
      metadata: {
        phase: "phase9_silent_failure_hardening",
      },
    })

    return existing
  }

  const data = await insertSucceededMockPpvPostPayment({
    userId,
    creatorId,
    postId,
    amount,
    currency,
  })

  await issueContentAccessGrant({
    viewerUserId: data.user_id,
    creatorId: data.creator_id,
    postId,
    paymentId: data.id,
    grantedAt: data.confirmed_at ?? new Date().toISOString(),
    sourceType: "ppv_post_mock_payment_succeeded",
    metadata: {
      phase: "phase9_silent_failure_hardening",
      paymentStatus: "succeeded",
    },
  })

  const creator = await readCreatorIdentityByCreatorId(creatorId)

  if (!creator?.userId) {
    throw new InfrastructureError("PPV_POST_CREATOR_NOTIFICATION_USER_NOT_FOUND", {
      metadata: {
        paymentId: data.id,
        userId,
        creatorId,
        postId,
      },
    })
  }

  const occurredAt = data.confirmed_at ?? new Date().toISOString()
  const paymentAmount = data.amount ?? amount
  const paymentCurrency = data.currency ?? currency ?? "KRW"

  await emitPaymentConfirmedNotificationEvent({
    paymentId: data.id,
    paymentType: "ppv_post",
    userId,
    creatorId,
    recipientUserId: creator.userId,
    amount: paymentAmount,
    grossAmount: paymentAmount,
    netAmount: paymentAmount,
    platformFee: 0,
    currency: paymentCurrency,
    occurredAt,
  })

  return data
}
