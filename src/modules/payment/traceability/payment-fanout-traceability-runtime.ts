import type { PaymentType } from "@/modules/payment/types"

import { isWave010PaymentFanoutTraceabilityEnabled } from "./feature-flags"
import { writeCanonicalPaymentFanoutTraceabilityNoThrow } from "./canonical-payment-fanout-traceability-repository"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type PaymentFanoutSideEffectKind =
  | "subscription_activation"
  | "settlement_earning_creation"
  | "ppv_target_normalization"
  | "notification_fanout"

export type PaymentFanoutTraceabilityInput = Readonly<{
  paymentId: string
  paymentType: PaymentType
  confirmedAt: string
  sideEffectKind: PaymentFanoutSideEffectKind
  fanoutSequence: number
  runtimeSurface: string
  fanoutStatus: "observed" | "skipped" | "failed"
  sideEffectStatus: "observed" | "skipped" | "failed"
  expectedForPayment: boolean
  sideEffectTable?: string | null
  sideEffectRowId?: string | null
  occurredAt?: string
  orderingSource?: string
  replayTimestampSource?: string
  orderingConfidence?: string
  lineageMetadata?: JsonRecord
  eventMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

export type PaymentFanoutTraceabilityValidationInput = Readonly<{
  paymentId: string
  fanoutOrderingDriftDetected?: boolean
  missingSideEffectLineage?: boolean
  replaySafeFanoutGapDetected?: boolean
  paymentToSubscriptionDivergenceDetected?: boolean
  paymentToEarningDivergenceDetected?: boolean
  replayOwnedSideEffectExecutionDetected?: boolean
  paymentFanoutAuthorityContaminationDetected?: boolean
  projectionFirstRoutingDetected?: boolean
  entitlementAuthorityPromotionDetected?: boolean
}>

export type PaymentFanoutTraceabilityValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  replayOwnedExecutionAllowed: false
  projectionFirstRoutingAllowed: false
  entitlementAuthorityPromotionAllowed: false
}>

function stableKeyPart(value: string | null | undefined): string {
  return value == null || value.trim() === "" ? "unknown" : value.trim()
}

function createFanoutKeys(input: PaymentFanoutTraceabilityInput) {
  const status = stableKeyPart(input.sideEffectStatus)

  return {
    paymentEventKey: `payment_event:${input.paymentId}:confirmed`,
    fanoutEventKey: [
      "payment_fanout_event",
      input.paymentId,
      input.fanoutSequence,
      input.sideEffectKind,
      status,
    ].join(":"),
    sideEffectLineageKey: [
      "payment_side_effect_lineage",
      input.paymentId,
      input.sideEffectKind,
      status,
    ].join(":"),
    fanoutOrderingKey: [
      "payment_fanout_ordering",
      input.paymentId,
      input.fanoutSequence,
      input.sideEffectKind,
    ].join(":"),
  }
}

export async function synchronizePaymentFanoutTraceabilityNoThrow(
  input: PaymentFanoutTraceabilityInput
): Promise<void> {
  if (!isWave010PaymentFanoutTraceabilityEnabled()) return

  try {
    const keys = createFanoutKeys(input)
    const occurredAt = input.occurredAt ?? new Date().toISOString()

    await writeCanonicalPaymentFanoutTraceabilityNoThrow({
      ...keys,
      paymentId: input.paymentId,
      sideEffectKind: input.sideEffectKind,
      runtimeSurface: input.runtimeSurface,
      fanoutStatus: input.fanoutStatus,
      fanoutSequence: input.fanoutSequence,
      expectedForPayment: input.expectedForPayment,
      sideEffectTable: input.sideEffectTable,
      sideEffectRowId: input.sideEffectRowId,
      sideEffectStatus: input.sideEffectStatus,
      occurredAt,
      orderingTimestamp: occurredAt,
      orderingSource:
        input.orderingSource ??
        `payment_confirmation_service.${input.sideEffectKind}`,
      replayTimestampSource:
        input.replayTimestampSource ?? "runtime_fanout_observed_at",
      orderingConfidence:
        input.orderingConfidence ?? "observed_runtime_fanout",
      lineageMetadata: {
        ...(input.lineageMetadata ?? {}),
        paymentType: input.paymentType,
        confirmedAt: input.confirmedAt,
      },
      eventMetadata: {
        ...(input.eventMetadata ?? {}),
        paymentType: input.paymentType,
        confirmedAt: input.confirmedAt,
      },
      orderingMetadata: {
        ...(input.orderingMetadata ?? {}),
        paymentType: input.paymentType,
        confirmedAt: input.confirmedAt,
        fanoutSequence: input.fanoutSequence,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        runtimeSurface: input.runtimeSurface,
        advisoryOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "payment.traceability.fanout.failed_open",
      message: "Payment fanout traceability failed open",
      error,
    })
  }
}

export function validatePaymentFanoutTraceabilityReadiness(
  input: PaymentFanoutTraceabilityValidationInput
): PaymentFanoutTraceabilityValidation {
  const blockers = [
    input.fanoutOrderingDriftDetected
      ? "payment_fanout_ordering_drift_detected"
      : null,
    input.missingSideEffectLineage
      ? "payment_side_effect_lineage_missing"
      : null,
    input.replaySafeFanoutGapDetected
      ? "payment_replay_safe_fanout_gap_detected"
      : null,
    input.paymentToSubscriptionDivergenceDetected
      ? "payment_to_subscription_lineage_divergence_detected"
      : null,
    input.paymentToEarningDivergenceDetected
      ? "payment_to_earning_lineage_divergence_detected"
      : null,
    input.replayOwnedSideEffectExecutionDetected
      ? "replay_owned_side_effect_execution_detected"
      : null,
    input.paymentFanoutAuthorityContaminationDetected
      ? "payment_fanout_authority_contamination_detected"
      : null,
    input.projectionFirstRoutingDetected
      ? "payment_fanout_projection_first_routing_detected"
      : null,
    input.entitlementAuthorityPromotionDetected
      ? "entitlement_authority_promotion_detected"
      : null,
  ].filter((blocker): blocker is string => blocker != null)

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    driftClass: blockers[0] ?? "none",
    driftSeverity: blockers.length > 0 ? "promotion_blocking" : "none",
    blockers,
    runtimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    replayOwnedExecutionAllowed: false,
    projectionFirstRoutingAllowed: false,
    entitlementAuthorityPromotionAllowed: false,
  }
}
