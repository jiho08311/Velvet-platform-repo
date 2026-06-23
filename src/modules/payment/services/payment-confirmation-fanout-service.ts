import { issueContentAccessGrant } from "@/modules/entitlement/public/access-grants"
import { isSettlablePaymentType } from "@/modules/payment/policies/payment-type-policy"
import type { PaymentConfirmRow } from "@/modules/payment/repositories/payment-read-repository"
import {
  type ConfirmedPaymentRow,
  setPaymentTargetType,
} from "@/modules/payment/repositories/payment-write-repository"
import {
  synchronizeCrossAggregateCorrelationNoThrow,
} from "@/modules/payment/traceability"
import type {
  PaymentFanoutResult,
} from "@/modules/payment/contracts/payment-confirmation-contract"
import { getPostById } from "@/modules/post/public/get-post"
import { synchronizeSubscriptionActivationProvenanceNoThrow } from "@/modules/subscription/public/subscription-traceability"
import { InfrastructureError } from "@/shared/errors"
import { synchronizePaymentFanoutTraceability, synchronizePaymentSideEffectLineage } from "./payment-confirmation-fanout-traceability"
import { notifyPaymentSideEffects } from "./payment-confirmation-notifications"
import { processPaymentConfirmationSettlement } from "./payment-confirmation-settlement"
import { activateSubscriptionFromPayment } from "./payment-confirmation-subscription"

type PaymentFanoutRuntimeRow = PaymentConfirmRow | ConfirmedPaymentRow

export async function runPostConfirmationSideEffects(
  payment: PaymentFanoutRuntimeRow
) {
  if (payment.type === "subscription") {
    const subscription = await activateSubscriptionFromPayment(payment)

    const subscriptionResult: PaymentFanoutResult = {
      fanoutStatus: subscription ? "observed" : "skipped",
      sideEffectStatus: subscription ? "observed" : "skipped",
      sideEffectTable: subscription ? "subscriptions" : null,
      sideEffectRowId: subscription?.id ?? null,
      metadata: {
        creatorId: payment.creator_id,
        subscriptionObserved: subscription != null,
      },
    }

    await synchronizeSubscriptionActivationProvenanceNoThrow({
      paymentId: payment.id,
      paymentType: payment.type,
      userId: payment.user_id,
      creatorId: payment.creator_id,
      provider: payment.provider,
      confirmedAt: payment.confirmed_at ?? new Date().toISOString(),
      subscriptionId: subscription?.id ?? null,
      providerSubscriptionId:
        subscription?.provider_subscription_id ?? payment.id,
      subscriptionStatus: subscription?.status ?? null,
      currentPeriodStart: subscription?.current_period_start ?? null,
      currentPeriodEnd: subscription?.current_period_end ?? null,
      runtimeSurface: "subscription_upsert_service",
      activationStatus: subscription ? "observed" : "skipped",
      provenanceMetadata: {
        paymentRuntimeAuthorityPreserved: true,
        subscriptionRuntimeAuthorityPreserved: true,
        entitlementRuntimeAuthorityPreserved: true,
      },
    })

    await synchronizePaymentFanoutTraceability(payment, {
      sideEffectKind: "subscription_activation",
      fanoutSequence: 10,
      runtimeSurface: "subscription_upsert_service",
      expectedForPayment: true,
      result: subscriptionResult,
    })
    await synchronizePaymentSideEffectLineage(payment, {
      sideEffectKind: "subscription_activation",
      fanoutSequence: 10,
      runtimeSurface: "subscription_upsert_service",
      result: subscriptionResult,
    })
  } else {
    const skippedSubscriptionResult: PaymentFanoutResult = {
      fanoutStatus: "skipped",
      sideEffectStatus: "skipped",
      sideEffectTable: "subscriptions",
      metadata: {
        skipReason: "payment_type_not_subscription",
      },
    }

    await synchronizePaymentFanoutTraceability(payment, {
      sideEffectKind: "subscription_activation",
      fanoutSequence: 10,
      runtimeSurface: "subscription_upsert_service",
      expectedForPayment: false,
      result: skippedSubscriptionResult,
    })
    await synchronizePaymentSideEffectLineage(payment, {
      sideEffectKind: "subscription_activation",
      fanoutSequence: 10,
      runtimeSurface: "subscription_upsert_service",
      result: skippedSubscriptionResult,
    })
  }

  const settlementResult = await processPaymentConfirmationSettlement({
    id: payment.id,
    creator_id: payment.creator_id,
    type: payment.type,
    amount: payment.amount,
    currency: payment.currency,
    confirmed_at: payment.confirmed_at,
  })

  await synchronizePaymentFanoutTraceability(payment, {
    sideEffectKind: "settlement_earning_creation",
    fanoutSequence: 20,
    runtimeSurface: "earning_creation_server",
    expectedForPayment: isSettlablePaymentType(payment.type),
    result: settlementResult,
  })
  await synchronizePaymentSideEffectLineage(payment, {
    sideEffectKind: "settlement_earning_creation",
    fanoutSequence: 20,
    runtimeSurface: "earning_creation_server",
    result: settlementResult,
  })
  await synchronizeCrossAggregateCorrelationNoThrow({
    sourceAggregate: "payment",
    targetAggregate: "settlement",
    sourceTable: "payments",
    sourceRowId: payment.id,
    targetTable: settlementResult.sideEffectTable ?? null,
    targetRowId: settlementResult.sideEffectRowId ?? null,
    paymentId: payment.id,
    earningId:
      settlementResult.sideEffectTable === "earnings"
        ? settlementResult.sideEffectRowId ?? null
        : null,
    entitlementSubjectUserId: payment.user_id,
    entitlementCreatorId: payment.creator_id,
    orderingTimestamp: payment.confirmed_at ?? new Date().toISOString(),
    correlationMetadata: {
      runtimeSurface: "payment_confirmation_service",
      fanoutStatus: settlementResult.fanoutStatus,
      sideEffectStatus: settlementResult.sideEffectStatus,
      paymentType: payment.type,
    },
    lineageMetadata: settlementResult.metadata,
    provenanceMetadata: {
      paymentRuntimeAuthorityPreserved: true,
      settlementRuntimeAuthorityPreserved: true,
      payoutRuntimeAuthorityPreserved: true,
      entitlementRuntimeAuthorityPreserved: true,
    },
  })

  if (
    payment.type === "ppv_post" &&
    payment.target_type === "post" &&
    payment.target_id
  ) {
    const post = await getPostById(payment.target_id, payment.user_id)

    if (post) {
      await issueContentAccessGrant({
        viewerUserId: payment.user_id,
        creatorId: post.creatorId,
        postId: payment.target_id,
        paymentId: payment.id,
        grantedAt: payment.confirmed_at ?? new Date().toISOString(),
        sourceType: "ppv_post_payment_succeeded",
        metadata: {
          phase: "phase9_silent_failure_hardening",
          paymentType: payment.type,
          paymentStatus: "succeeded",
          runtimeSurface: "payment_confirmation_service",
          paymentCreatorId: payment.creator_id,
          resolvedCreatorId: post.creatorId,
        },
      })
    } else {
      throw new InfrastructureError(
        "POST_RESOLUTION_FAILED_FOR_CONTENT_GRANT",
        {
          metadata: {
            paymentId: payment.id,
            postId: payment.target_id,
            viewerUserId: payment.user_id,
          },
        }
      )
    }
  }

  if (payment.type === "ppv_message") {
    await setPaymentTargetType({
      paymentId: payment.id,
      targetType: "message",
    })

    const targetNormalizationResult: PaymentFanoutResult = {
      fanoutStatus: "observed",
      sideEffectStatus: "observed",
      sideEffectTable: "payments",
      sideEffectRowId: payment.id,
      metadata: {
        targetType: "message",
        targetTypeNormalized: true,
      },
    }

    await synchronizePaymentFanoutTraceability(payment, {
      sideEffectKind: "ppv_target_normalization",
      fanoutSequence: 30,
      runtimeSurface: "payment_write_repository",
      expectedForPayment: true,
      result: targetNormalizationResult,
    })
    await synchronizePaymentSideEffectLineage(payment, {
      sideEffectKind: "ppv_target_normalization",
      fanoutSequence: 30,
      runtimeSurface: "payment_write_repository",
      result: targetNormalizationResult,
    })
  } else {
    const skippedTargetNormalizationResult: PaymentFanoutResult = {
      fanoutStatus: "skipped",
      sideEffectStatus: "skipped",
      sideEffectTable: "payments",
      sideEffectRowId: payment.id,
      metadata: {
        skipReason: "payment_type_not_ppv_message",
      },
    }

    await synchronizePaymentFanoutTraceability(payment, {
      sideEffectKind: "ppv_target_normalization",
      fanoutSequence: 30,
      runtimeSurface: "payment_write_repository",
      expectedForPayment: false,
      result: skippedTargetNormalizationResult,
    })
    await synchronizePaymentSideEffectLineage(payment, {
      sideEffectKind: "ppv_target_normalization",
      fanoutSequence: 30,
      runtimeSurface: "payment_write_repository",
      result: skippedTargetNormalizationResult,
    })
  }

  const notificationResult = await notifyPaymentSideEffects(payment)

  await synchronizePaymentFanoutTraceability(payment, {
    sideEffectKind: "notification_fanout",
    fanoutSequence: 40,
    runtimeSurface: "notification_creation_service",
    expectedForPayment: true,
    result: notificationResult,
  })
  await synchronizePaymentSideEffectLineage(payment, {
    sideEffectKind: "notification_fanout",
    fanoutSequence: 40,
    runtimeSurface: "notification_creation_service",
    result: notificationResult,
  })
}
