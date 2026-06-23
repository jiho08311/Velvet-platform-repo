import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalSettlementEventTopologyInsert = Readonly<{
  settlementOrderingKey: string
  settlementProvenanceKey: string
  settlementReconstructionKey: string
  settlementEventKey: string
  earningLineageKey?: string | null
  earningProvenanceKey?: string | null
  earningReconstructionKey?: string | null
  paymentEventKey?: string | null
  paymentFanoutEventKey?: string | null
  paymentSideEffectLineageKey?: string | null
  paymentId: string
  earningId: string
  creatorId: string
  sourceType: string
  runtimeSurface: string
  orderingTimestamp: string
  orderingSource: string
  replayTimestampSource: string
  orderingConfidence: string
  provenanceSource: string
  provenanceStatus: string
  reconstructionStatus: string
  reconstructionConfidence: string
  paymentObserved: boolean
  earningObserved: boolean
  orderingObserved: boolean
  provenanceObserved: boolean
  amountObserved: boolean
  payoutEligibilityObserved: boolean
  replaySafeReconstructable: boolean
  orderingMetadata?: JsonRecord
  lineageMetadata?: JsonRecord
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

export async function writeCanonicalSettlementEventTopology(
  input: CanonicalSettlementEventTopologyInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-022",
    aggregateRoot: "canonical_settlement_event.id",
    runtimeAuthoritative: true,
    earningRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    earningLifecycleRuntimeAuthorityPreserved: true,
    earningsMutableSettlementStatePreserved: true,
    payoutEligibilityRuntimeAuthorityPreserved: true,
    immutableLedgerPromotionAllowed: false,
    payoutEligibilityReplacementAllowed: false,
    replayMutationAllowed: false,
    replayOwnedExecutionAllowed: false,
    reconciliationRepairAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_settlement_ordering").upsert(
      {
        settlement_ordering_key: input.settlementOrderingKey,
        settlement_event_key: input.settlementEventKey,
        payment_id: input.paymentId,
        earning_id: input.earningId,
        creator_id: input.creatorId,
        source_type: input.sourceType,
        runtime_surface: input.runtimeSurface,
        ordering_surface: "settlement.event.replay_ordering",
        ordering_timestamp: input.orderingTimestamp,
        ordering_source: input.orderingSource,
        replay_timestamp_source: input.replayTimestampSource,
        ordering_confidence: input.orderingConfidence,
        ordering_metadata: input.orderingMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "settlement_ordering_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_settlement_provenance").upsert(
      {
        settlement_provenance_key: input.settlementProvenanceKey,
        settlement_event_key: input.settlementEventKey,
        settlement_ordering_key: input.settlementOrderingKey,
        earning_lineage_key: input.earningLineageKey ?? null,
        earning_provenance_key: input.earningProvenanceKey ?? null,
        payment_event_key: input.paymentEventKey ?? null,
        payment_fanout_event_key: input.paymentFanoutEventKey ?? null,
        payment_side_effect_lineage_key:
          input.paymentSideEffectLineageKey ?? null,
        payment_id: input.paymentId,
        earning_id: input.earningId,
        creator_id: input.creatorId,
        source_type: input.sourceType,
        runtime_surface: input.runtimeSurface,
        provenance_surface: "settlement.event.provenance",
        provenance_source: input.provenanceSource,
        provenance_status: input.provenanceStatus,
        source_table: "payments",
        source_row_id: input.paymentId,
        target_table: "earnings",
        target_row_id: input.earningId,
        provenance_metadata: provenanceMetadata,
        lineage_metadata: input.lineageMetadata ?? {},
      },
      { onConflict: "settlement_provenance_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_settlement_reconstruction_metadata").upsert(
      {
        settlement_reconstruction_key: input.settlementReconstructionKey,
        settlement_event_key: input.settlementEventKey,
        settlement_ordering_key: input.settlementOrderingKey,
        settlement_provenance_key: input.settlementProvenanceKey,
        earning_reconstruction_key: input.earningReconstructionKey ?? null,
        payment_id: input.paymentId,
        earning_id: input.earningId,
        creator_id: input.creatorId,
        source_type: input.sourceType,
        reconstruction_surface: "settlement.event.reconstruction",
        reconstruction_status: input.reconstructionStatus,
        reconstruction_confidence: input.reconstructionConfidence,
        payment_observed: input.paymentObserved,
        earning_observed: input.earningObserved,
        ordering_observed: input.orderingObserved,
        provenance_observed: input.provenanceObserved,
        amount_observed: input.amountObserved,
        payout_eligibility_observed: input.payoutEligibilityObserved,
        replay_safe_reconstructable: input.replaySafeReconstructable,
        reconstruction_metadata: input.reconstructionMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "settlement_reconstruction_key" }
    )
  )
}

export async function writeCanonicalSettlementEventTopologyNoThrow(
  input: CanonicalSettlementEventTopologyInsert
): Promise<void> {
  try {
    await writeCanonicalSettlementEventTopology(input)
  } catch (error) {
    logger.warn({
      event: "payout.traceability.canonical_settlement_event_topology.write_failed",
      message: "Canonical settlement event topology write failed",
      error,
    })
  }
}
