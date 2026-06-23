import { synchronizeFinancialTimelineNoThrow } from "@/shared/observability/financial-timeline"
import { logger } from "@/shared/observability/structured-logger"
import { writeCanonicalEntitlementEventNoThrow } from "./canonical-entitlement-event-repository"
import { synchronizeCanonicalEntitlementEventFanoutNoThrow } from "./entitlement-event-fanout-runtime"
import { isWave010CanonicalEntitlementEventEnabled } from "./feature-flags"

export {
  validateCanonicalEntitlementEventReadiness,
  type CanonicalEntitlementEventValidation,
  type CanonicalEntitlementEventValidationInput,
} from "./entitlement-event-readiness-policy"

type JsonRecord = Record<string, unknown>

export type CanonicalEntitlementEventInput = Readonly<{
  subjectUserId: string
  issuerCreatorId: string
  entitlementSurface?: string
  entitlementKind?: string
  lifecycleState: "active" | "canceled" | "expired" | "absent" | "invalid"
  hasAccess: boolean
  subscriptionId?: string | null
  paymentId?: string | null
  sourceTable?: string | null
  sourceRowId?: string | null
  orderingTimestamp?: string | null
  subscriptionLineageKey?: string | null
  entitlementIssuanceProvenanceKey?: string | null
  eventMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

function stableKeyPart(value: string | null | undefined): string {
  return value == null || value.trim() === "" ? "unknown" : value.trim()
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function uuidOrNull(value: string | null | undefined): string | null {
  const candidate = value?.trim()

  if (!candidate) return null

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    candidate
  )
    ? candidate
    : null
}

function createEntitlementKeys(input: CanonicalEntitlementEventInput) {
  const surface = stableKeyPart(
    input.entitlementSurface ?? "subscription_access"
  )
  const subject = stableKeyPart(input.subjectUserId)
  const issuer = stableKeyPart(input.issuerCreatorId)
  const subscription = stableKeyPart(input.subscriptionId)
  const state = stableKeyPart(input.lifecycleState)

  return {
    legacyEntitlementKey: [
      "runtime_entitlement",
      surface,
      subject,
      issuer,
      subscription,
    ].join(":"),
    entitlementEventKey: [
      "canonical_entitlement_event",
      surface,
      subject,
      issuer,
      subscription,
      state,
    ].join(":"),
    entitlementOrderingKey: [
      "canonical_entitlement_ordering",
      surface,
      subject,
      issuer,
      subscription,
    ].join(":"),
    entitlementProvenanceKey: [
      "canonical_entitlement_provenance",
      surface,
      subject,
      issuer,
      subscription,
    ].join(":"),
    entitlementReconstructionKey: [
      "canonical_entitlement_reconstruction",
      surface,
      subject,
      issuer,
      subscription,
    ].join(":"),
  }
}

function reconstructionConfidence(input: {
  eventObserved: boolean
  orderingObserved: boolean
  provenanceObserved: boolean
  subscriptionLineageObserved: boolean
}): string {
  if (
    input.eventObserved &&
    input.orderingObserved &&
    input.provenanceObserved &&
    input.subscriptionLineageObserved
  ) {
    return "entitlement_reconstruction_complete"
  }

  if (input.eventObserved && input.orderingObserved && input.provenanceObserved) {
    return "entitlement_reconstruction_partial"
  }

  return "entitlement_reconstruction_incomplete"
}

export async function synchronizeCanonicalEntitlementEventNoThrow(
  input: CanonicalEntitlementEventInput
): Promise<void> {
  if (!isWave010CanonicalEntitlementEventEnabled()) return

  try {
    const keys = createEntitlementKeys(input)
    const orderingTimestamp =
      input.orderingTimestamp ?? new Date().toISOString()
    const eventObserved = Boolean(input.subjectUserId && input.issuerCreatorId)
    const orderingObserved = Boolean(orderingTimestamp)
    const provenanceObserved = true
    const subscriptionLineageObserved = Boolean(input.subscriptionId)
    const reconstructionCompletenessScore = clampScore(
      [
        eventObserved,
        orderingObserved,
        provenanceObserved,
        subscriptionLineageObserved,
      ].filter(Boolean).length / 4
    )
    const confidence = reconstructionConfidence({
      eventObserved,
      orderingObserved,
      provenanceObserved,
      subscriptionLineageObserved,
    })
    const entitlementSurface =
      input.entitlementSurface ?? "subscription_access"
    const entitlementKind = input.entitlementKind ?? "subscription_access"

    await writeCanonicalEntitlementEventNoThrow({
      ...keys,
      entitlementSubjectUserId: uuidOrNull(input.subjectUserId),
      entitlementIssuerCreatorId: uuidOrNull(input.issuerCreatorId),
      relatedSubscriptionId: uuidOrNull(input.subscriptionId),
      relatedPaymentId: uuidOrNull(input.paymentId),
      sourceTable: input.sourceTable ?? null,
      sourceRowId: uuidOrNull(input.sourceRowId),
      entitlementSurface,
      entitlementKind,
      entitlementLifecycleState: input.lifecycleState,
      subscriptionLineageKey: input.subscriptionLineageKey ?? null,
      entitlementIssuanceProvenanceKey:
        input.entitlementIssuanceProvenanceKey ?? null,
      entitlementDriftClass: "none",
      entitlementDriftSeverity: "none",
      orderingTimestamp,
      orderingSource: "runtime_entitlement_access_composition.observed_at",
      replayTimestampSource: "legacy_subscription_runtime_timestamp",
      lineageCompletenessScore: subscriptionLineageObserved ? 1 : 0,
      reconstructionCompletenessScore,
      reconstructionConfidence: confidence,
      eventObserved,
      orderingObserved,
      provenanceObserved,
      subscriptionLineageObserved,
      replaySafeReconstructable:
        confidence !== "entitlement_reconstruction_incomplete",
      eventMetadata: {
        ...(input.eventMetadata ?? {}),
        hasAccess: input.hasAccess,
        entitlementSurface,
        entitlementKind,
      },
      orderingMetadata: {
        orderingTimestamp,
        replaySafeEntitlementOrderingObservable: true,
        replayOwnedEntitlementMutationAllowed: false,
      },
      provenanceSnapshot: {
        runtimeEntitlementAuthorityPreserved: true,
        subscriptionRuntimeAuthorityPreserved: true,
        canonicalEntitlementServingAuthority: false,
        replayOwnedEntitlementMutationAllowed: false,
      },
      governanceSnapshot: {
        entitlementAuthorityPromotionAllowed: false,
        projectionEntitlementAuthorityAllowed: false,
        runtimeAuthorityTransferAllowed: false,
      },
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        entitlementLineageCompletenessMeasurable: true,
        entitlementReconstructionMeasurable: true,
        replaySafeReconstructable:
          confidence !== "entitlement_reconstruction_incomplete",
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        advisoryOnly: true,
        synchronizedCandidateOnly: true,
      },
    })
    await synchronizeFinancialTimelineNoThrow({
      timelineSurface: "financial.timeline.entitlement",
      timelineKey: keys.entitlementEventKey,
      runtimeSurface: "runtime_entitlement_access_composition",
      sourceAggregate: "entitlement",
      targetAggregate: "subscription",
      sourceTable: input.sourceTable ?? null,
      sourceRowId: input.sourceRowId ?? null,
      paymentId: input.paymentId ?? null,
      subscriptionId: input.subscriptionId ?? null,
      entitlementSubjectUserId: input.subjectUserId,
      entitlementCreatorId: input.issuerCreatorId,
      lifecycleStage: input.lifecycleState,
      lifecycleSequence: 30,
      orderingTimestamp,
      orderingSource: "runtime_entitlement_access_composition.observed_at",
      replayTimestampSource: "legacy_subscription_runtime_timestamp",
      lineageObserved: subscriptionLineageObserved,
      timelineMetadata: {
        entitlementEventKey: keys.entitlementEventKey,
        entitlementSurface,
        entitlementKind,
        hasAccess: input.hasAccess,
      },
      reconstructionMetadata: {
        entitlementReconstructionConfidence: confidence,
      },
      provenanceMetadata: {
        sourceBrief: "Wave-010-FEL-BR-036",
        advisoryOnly: true,
      },
    })
    await synchronizeCanonicalEntitlementEventFanoutNoThrow({
      confidence,
      entitlementEventKey: keys.entitlementEventKey,
      entitlementKind,
      entitlementSurface,
      eventObserved,
      input,
      orderingTimestamp,
    })
  } catch (error) {
    logger.warn({
      event: "subscription.traceability.entitlement_event_failed_open",
      error,
    })
  }
}
