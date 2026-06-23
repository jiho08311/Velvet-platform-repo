import type { PaymentFanoutResult } from "@/modules/payment/contracts/payment-confirmation-contract"
import { emitPaymentConfirmedNotificationEvent } from "@/modules/payment/events/payment-domain-events"
import { findCreatorNotificationUserId } from "@/modules/payment/repositories/payment-read-repository"
import type { PaymentType } from "@/modules/payment/types"
import { createAndTraceSilentFailureEvent } from "@/shared/observability/silent-failure-event"

export async function notifyPaymentSideEffects(payment: {
  id: string
  user_id: string
  creator_id: string | null
  type: PaymentType
  amount: number
  currency: string | null
  confirmed_at: string | null
}): Promise<PaymentFanoutResult> {
  try {
    const occurredAt = payment.confirmed_at ?? new Date().toISOString()
    const amount = payment.amount ?? 0
    const currency = payment.currency ?? "KRW"
    const revenuePayload = {
      amount,
      grossAmount: amount,
      netAmount: amount,
      platformFee: 0,
      currency,
      occurredAt,
    }

    await emitPaymentConfirmedNotificationEvent({
      paymentId: payment.id,
      paymentType: payment.type,
      userId: payment.user_id,
      creatorId: payment.creator_id,
      recipientUserId: payment.user_id,
      ...revenuePayload,
    })

    if (
      (payment.type === "ppv_message" || payment.type === "ppv_post") &&
      payment.creator_id
    ) {
      const creatorUserId = await findCreatorNotificationUserId(
        payment.creator_id
      )

      if (creatorUserId) {
        await emitPaymentConfirmedNotificationEvent({
          paymentId: payment.id,
          paymentType: payment.type,
          userId: payment.user_id,
          creatorId: payment.creator_id,
          recipientUserId: creatorUserId,
          ...revenuePayload,
        })
      }
    }

    return {
      fanoutStatus: "observed",
      sideEffectStatus: "observed",
      sideEffectTable: "domain_events",
      metadata: {
        notificationEventObserved: true,
      },
    }
  } catch (error) {
    createAndTraceSilentFailureEvent({
      category: "notification_side_effect_swallowed",
      severity: "high",
      failureMode: "catch_console_error_only",
      provenance: {
        sourceFile:
          "src/modules/payment/services/payment-confirmation-service.ts",
        operationName: "notifyPaymentSideEffects",
        domain: "notification",
        actorType: "system",
        authorityScope: {
          authority: "notification.event_emit",
          resourceType: "payment",
          resourceId: payment.id,
        },
      },
      ignoredExecution: {
        ignored: true,
        mechanism: "catch_fallback",
        rejectionObserved: true,
      },
      error,
      metadata: {
        paymentId: payment.id,
        userId: payment.user_id,
        creatorId: payment.creator_id,
        type: payment.type,
      },
    })

    return {
      fanoutStatus: "failed",
      sideEffectStatus: "failed",
      sideEffectTable: "domain_events",
      metadata: {
        failureMode: "notification_event_emit_failed",
      },
    }
  }
}
