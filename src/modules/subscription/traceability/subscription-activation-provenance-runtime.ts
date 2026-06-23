import type { PaymentProvider, PaymentType } from "@/modules/payment/types"
import { logger } from "@/shared/observability/structured-logger"

import { isWave010SubscriptionActivationProvenanceEnabled } from "./feature-flags"
import { writeCanonicalSubscriptionActivationProvenanceNoThrow } from "./canonical-subscription-activation-provenance-repository"

type JsonRecord = Record<string, unknown>

export type SubscriptionActivationProvenanceInput = Readonly<{
  paymentId: string
  paymentType: PaymentType
  userId: string
  creatorId?: string | null
  provider: PaymentProvider
  confirmedAt: string
  subscriptionId?: string | null
  providerSubscriptionId?: string | null
  subscriptionStatus?: string | null
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  runtimeSurface?: string
  activationStatus?: "observed" | "skipped" | "failed"
  orderingSource?: string
  replayTimestampSource?: string
  orderingConfidence?: string
  lineageMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  entitlementMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

export type SubscriptionActivationProvenanceValidationInput = Readonly<{
  paymentId: string
  subscriptionLineageMissing?: boolean
  subscriptionOrderingDriftDetected?: boolean
  replaySafeSubscriptionGapDetected?: boolean
  paymentToSubscriptionDivergenceDetected?: boolean
  entitlementIssuanceMismatchDetected?: boolean
  entitlementProvenanceInstabilityDetected?: boolean
  replayOwnedSubscriptionMutationDetected?: boolean
  reconciliationOwnedRepairDetected?: boolean
  entitlementAuthorityContaminationDetected?: boolean
  subscriptionServingReplacementDetected?: boolean
}>

export type SubscriptionActivationProvenanceValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  subscriptionRuntimeAuthoritative: true
  entitlementRuntimeAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  replayOwnedSubscriptionMutationAllowed: false
  reconciliationRepairAllowed: false
  entitlementAuthorityPromotionAllowed: false
}>

function stableKeyPart(value: string | null | undefined): string {
  return value == null || value.trim() === "" ? "unknown" : value.trim()
}

function observed(value: string | null | undefined): boolean {
  return value != null && value.trim() !== ""
}

function reconstructionConfidence(input: {
  paymentObserved: boolean
  subscriptionObserved: boolean
  activationTimestampObserved: boolean
  entitlementProvenanceObserved: boolean
}): string {
  if (
    input.paymentObserved &&
    input.subscriptionObserved &&
    input.activationTimestampObserved &&
    input.entitlementProvenanceObserved
  ) {
    return "subscription_runtime_complete"
  }

  if (input.paymentObserved && input.activationTimestampObserved) {
    return "subscription_runtime_partial"
  }

  return "subscription_runtime_incomplete"
}

function createSubscriptionActivationKeys(
  input: SubscriptionActivationProvenanceInput
) {
  const subscription = stableKeyPart(input.subscriptionId)
  const creator = stableKeyPart(input.creatorId)

  return {
    paymentEventKey: `payment_event:${input.paymentId}:confirmed`,
    paymentFanoutEventKey: [
      "payment_fanout_event",
      input.paymentId,
      10,
      "subscription_activation",
      stableKeyPart(input.activationStatus ?? "observed"),
    ].join(":"),
    subscriptionActivationLineageKey: [
      "subscription_activation_lineage",
      input.paymentId,
      subscription,
      creator,
    ].join(":"),
    subscriptionOrderingKey: [
      "subscription_ordering",
      input.paymentId,
      subscription,
      stableKeyPart(input.confirmedAt),
    ].join(":"),
    entitlementIssuanceProvenanceKey: [
      "entitlement_issuance_provenance",
      "subscription_access",
      input.paymentId,
      subscription,
    ].join(":"),
    subscriptionReconstructionKey: [
      "subscription_reconstruction",
      input.paymentId,
      subscription,
      creator,
    ].join(":"),
  }
}

export async function synchronizeSubscriptionActivationProvenanceNoThrow(
  input: SubscriptionActivationProvenanceInput
): Promise<void> {
  if (!isWave010SubscriptionActivationProvenanceEnabled()) return
  if (!input.creatorId) return

  try {
    const keys = createSubscriptionActivationKeys(input)
    const paymentObserved = observed(input.paymentId)
    const subscriptionObserved = observed(input.subscriptionId)
    const activationTimestampObserved = observed(input.confirmedAt)
    const entitlementProvenanceObserved = subscriptionObserved
    const confidence = reconstructionConfidence({
      paymentObserved,
      subscriptionObserved,
      activationTimestampObserved,
      entitlementProvenanceObserved,
    })
    const runtimeSurface =
      input.runtimeSurface ?? "subscription_upsert_service"

    await writeCanonicalSubscriptionActivationProvenanceNoThrow({
      ...keys,
      paymentId: input.paymentId,
      userId: input.userId,
      creatorId: input.creatorId,
      provider: input.provider,
      providerSubscriptionId:
        input.providerSubscriptionId ?? input.paymentId,
      subscriptionId: input.subscriptionId,
      activationStatus:
        input.activationStatus ??
        (subscriptionObserved ? "observed" : "skipped"),
      subscriptionStatus: input.subscriptionStatus,
      runtimeSurface,
      currentPeriodStart: input.currentPeriodStart,
      currentPeriodEnd: input.currentPeriodEnd,
      activatedAt: input.confirmedAt,
      orderingTimestamp: input.confirmedAt,
      orderingSource:
        input.orderingSource ??
        "payment_confirmation_service.subscription_activation",
      replayTimestampSource:
        input.replayTimestampSource ?? "payments.confirmed_at",
      orderingConfidence:
        input.orderingConfidence ??
        "observed_runtime_subscription_activation",
      reconstructionStatus: "observed",
      reconstructionConfidence: confidence,
      paymentObserved,
      subscriptionObserved,
      activationTimestampObserved,
      entitlementProvenanceObserved,
      lineageMetadata: {
        ...(input.lineageMetadata ?? {}),
        paymentType: input.paymentType,
        confirmedAt: input.confirmedAt,
      },
      orderingMetadata: {
        ...(input.orderingMetadata ?? {}),
        paymentType: input.paymentType,
        subscriptionStatus: input.subscriptionStatus,
      },
      entitlementMetadata: {
        ...(input.entitlementMetadata ?? {}),
        paymentType: input.paymentType,
        entitlementSurface: "subscription_access",
        entitlementRuntimeAuthorityPreserved: true,
        entitlementMutationAllowed: false,
      },
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        paymentType: input.paymentType,
        subscriptionReconstructionMeasurable: true,
        replayOwnedSubscriptionMutation: false,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        runtimeSurface,
        advisoryOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "subscription.traceability.subscription_activation_provenance_failed_open",
      error,
    })
  }
}

export function validateSubscriptionActivationProvenanceReadiness(
  input: SubscriptionActivationProvenanceValidationInput
): SubscriptionActivationProvenanceValidation {
  const blockers = [
    input.subscriptionLineageMissing
      ? "subscription_activation_lineage_missing"
      : null,
    input.subscriptionOrderingDriftDetected
      ? "subscription_ordering_drift_detected"
      : null,
    input.replaySafeSubscriptionGapDetected
      ? "replay_safe_subscription_gap_detected"
      : null,
    input.paymentToSubscriptionDivergenceDetected
      ? "payment_to_subscription_lineage_divergence_detected"
      : null,
    input.entitlementIssuanceMismatchDetected
      ? "entitlement_issuance_mismatch_detected"
      : null,
    input.entitlementProvenanceInstabilityDetected
      ? "entitlement_provenance_instability_detected"
      : null,
    input.replayOwnedSubscriptionMutationDetected
      ? "replay_owned_subscription_mutation_detected"
      : null,
    input.reconciliationOwnedRepairDetected
      ? "subscription_reconciliation_owned_repair_detected"
      : null,
    input.entitlementAuthorityContaminationDetected
      ? "entitlement_authority_contamination_detected"
      : null,
    input.subscriptionServingReplacementDetected
      ? "subscription_serving_replacement_detected"
      : null,
  ].filter((blocker): blocker is string => blocker != null)

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    driftClass: blockers[0] ?? "none",
    driftSeverity: blockers.length > 0 ? "promotion_blocking" : "none",
    blockers,
    runtimeAuthoritative: true,
    subscriptionRuntimeAuthoritative: true,
    entitlementRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    replayOwnedSubscriptionMutationAllowed: false,
    reconciliationRepairAllowed: false,
    entitlementAuthorityPromotionAllowed: false,
  }
}
