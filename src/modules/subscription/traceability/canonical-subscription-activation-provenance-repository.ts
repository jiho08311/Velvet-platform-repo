import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalSubscriptionActivationProvenanceInsert = Readonly<{
  subscriptionActivationLineageKey: string
  subscriptionOrderingKey: string
  entitlementIssuanceProvenanceKey: string
  subscriptionReconstructionKey: string
  subscriptionId?: string | null
  paymentId: string
  paymentEventKey?: string | null
  paymentFanoutEventKey?: string | null
  userId: string
  creatorId: string
  provider: string
  providerSubscriptionId?: string | null
  activationStatus: string
  subscriptionStatus?: string | null
  runtimeSurface: string
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  activatedAt: string
  orderingTimestamp: string
  orderingSource: string
  replayTimestampSource: string
  orderingConfidence: string
  reconstructionStatus: string
  reconstructionConfidence: string
  paymentObserved: boolean
  subscriptionObserved: boolean
  activationTimestampObserved: boolean
  entitlementProvenanceObserved: boolean
  lineageMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  entitlementMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

async function assertNoSupabaseError(
  operation: PromiseLike<{ error: unknown }>
): Promise<void> {
  const { error } = await operation

  if (error) {
    throw error
  }
}

export async function writeCanonicalSubscriptionActivationProvenance(
  input: CanonicalSubscriptionActivationProvenanceInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-013",
    aggregateRoot: "canonical_subscription_activation.id",
    runtimeAuthoritative: true,
    subscriptionRuntimeAuthoritative: true,
    entitlementRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    subscriptionActivationRuntimeAuthorityPreserved: true,
    entitlementRuntimeAuthorityPreserved: true,
    subscriptionServingReplacementAllowed: false,
    replayMutationAllowed: false,
    replayOwnedExecutionAllowed: false,
    entitlementAuthorityPromotionAllowed: false,
    reconciliationRepairAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_subscription_activation_lineage").upsert(
      {
        subscription_activation_lineage_key:
          input.subscriptionActivationLineageKey,
        subscription_id: input.subscriptionId ?? null,
        payment_id: input.paymentId,
        payment_event_key: input.paymentEventKey ?? null,
        payment_fanout_event_key: input.paymentFanoutEventKey ?? null,
        user_id: input.userId,
        creator_id: input.creatorId,
        provider: input.provider,
        provider_subscription_id: input.providerSubscriptionId ?? null,
        activation_status: input.activationStatus,
        subscription_status: input.subscriptionStatus ?? null,
        runtime_surface: input.runtimeSurface,
        source_table: "payments",
        source_row_id: input.paymentId,
        subscription_table: "subscriptions",
        subscription_row_id: input.subscriptionId ?? null,
        current_period_start: input.currentPeriodStart ?? null,
        current_period_end: input.currentPeriodEnd ?? null,
        lineage_metadata: input.lineageMetadata ?? {},
        provenance_metadata: provenanceMetadata,
        activated_at: input.activatedAt,
      },
      { onConflict: "subscription_activation_lineage_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_subscription_ordering").upsert(
      {
        subscription_ordering_key: input.subscriptionOrderingKey,
        subscription_activation_lineage_key:
          input.subscriptionActivationLineageKey,
        subscription_id: input.subscriptionId ?? null,
        payment_id: input.paymentId,
        payment_event_key: input.paymentEventKey ?? null,
        user_id: input.userId,
        creator_id: input.creatorId,
        activation_sequence: 10,
        ordering_timestamp: input.orderingTimestamp,
        ordering_source: input.orderingSource,
        replay_timestamp_source: input.replayTimestampSource,
        ordering_confidence: input.orderingConfidence,
        ordering_metadata: {
          ...(input.orderingMetadata ?? {}),
          subscriptionActivationLineageKey:
            input.subscriptionActivationLineageKey,
          entitlementIssuanceProvenanceKey:
            input.entitlementIssuanceProvenanceKey,
        },
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "subscription_ordering_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_entitlement_issuance_provenance").upsert(
      {
        entitlement_issuance_provenance_key:
          input.entitlementIssuanceProvenanceKey,
        subscription_activation_lineage_key:
          input.subscriptionActivationLineageKey,
        subscription_id: input.subscriptionId ?? null,
        payment_id: input.paymentId,
        user_id: input.userId,
        creator_id: input.creatorId,
        entitlement_surface: "subscription_access",
        issuance_status: input.subscriptionObserved ? "observed" : "skipped",
        issuance_source: "runtime_subscription_state",
        runtime_surface: "runtime_entitlement_access_composition",
        entitlement_metadata: input.entitlementMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "entitlement_issuance_provenance_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_subscription_reconstruction_metadata").upsert(
      {
        subscription_reconstruction_key: input.subscriptionReconstructionKey,
        subscription_activation_lineage_key:
          input.subscriptionActivationLineageKey,
        subscription_ordering_key: input.subscriptionOrderingKey,
        entitlement_issuance_provenance_key:
          input.entitlementIssuanceProvenanceKey,
        subscription_id: input.subscriptionId ?? null,
        payment_id: input.paymentId,
        user_id: input.userId,
        creator_id: input.creatorId,
        provider: input.provider,
        provider_subscription_id: input.providerSubscriptionId ?? null,
        reconstruction_status: input.reconstructionStatus,
        reconstruction_confidence: input.reconstructionConfidence,
        payment_observed: input.paymentObserved,
        subscription_observed: input.subscriptionObserved,
        activation_timestamp_observed: input.activationTimestampObserved,
        entitlement_provenance_observed: input.entitlementProvenanceObserved,
        reconstruction_metadata: input.reconstructionMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "subscription_reconstruction_key" }
    )
  )
}

export async function writeCanonicalSubscriptionActivationProvenanceNoThrow(
  input: CanonicalSubscriptionActivationProvenanceInsert
): Promise<void> {
  try {
    await writeCanonicalSubscriptionActivationProvenance(input)
  } catch (error) {
    logger.warn({
      event: "subscription.traceability.canonical_subscription_activation_provenance_write_failed",
      error,
    })
  }
}
