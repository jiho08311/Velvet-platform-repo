import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalPayoutEventTopologyInsert = Readonly<{
  payoutEventKey: string
  payoutOrderingKey: string
  payoutProvenanceKey: string
  payoutReconstructionKey?: string | null
  payoutApprovalKey?: string | null
  payoutTerminalEventKey?: string | null
  payoutApprovalOrderingKey?: string | null
  payoutTerminalOrderingKey?: string | null
  privilegedExecutionKey?: string | null
  serviceRoleExecutionKey?: string | null
  payoutRequestId?: string | null
  payoutId?: string | null
  creatorId: string
  eventKind: string
  lifecycleStage: string
  lifecycleSequence: number
  previousPayoutStatus?: string | null
  nextPayoutStatus: string
  amount?: number | null
  currency: string
  runtimeSurface: string
  authoritySurface: string
  sourceTable: string
  sourceRowId?: string | null
  targetTable?: string | null
  targetRowId?: string | null
  orderingTimestamp: string
  orderingSource: string
  replayTimestampSource: string
  orderingConfidence: string
  provenanceSource: string
  provenanceStatus: string
  reconstructionConfidence: string
  payoutApprovalObserved: boolean
  payoutTerminalEventObserved: boolean
  replaySafeOrderingObserved: boolean
  lifecycleReconstructionObserved: boolean
  eventMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  lineageMetadata?: JsonRecord
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

export async function writeCanonicalPayoutEventTopology(
  input: CanonicalPayoutEventTopologyInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-024",
    aggregateRoot: "canonical_payout_event.id",
    runtimeAuthoritative: true,
    payoutRuntimeAuthoritative: true,
    payoutTerminalExecutionAuthoritative: true,
    payoutApprovalExecutionAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    synchronizedCandidateOnly: true,
    advisoryOnly: true,
    payoutRuntimeAuthorityPreserved: true,
    payoutTerminalExecutionAuthorityPreserved: true,
    payoutApprovalExecutionAuthorityPreserved: true,
    payoutExecutionTransferAllowed: false,
    runtimePayoutReplacementAllowed: false,
    replayMutationAllowed: false,
    replayOwnedExecutionAllowed: false,
    reconciliationRepairAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payout_events").upsert(
      {
        payout_event_key: input.payoutEventKey,
        payout_request_id: input.payoutRequestId ?? null,
        payout_id: input.payoutId ?? null,
        creator_id: input.creatorId,
        event_kind: input.eventKind,
        lifecycle_stage: input.lifecycleStage,
        previous_payout_status: input.previousPayoutStatus ?? null,
        next_payout_status: input.nextPayoutStatus,
        amount: input.amount ?? null,
        currency: input.currency,
        runtime_surface: input.runtimeSurface,
        authority_surface: input.authoritySurface,
        source_table: input.sourceTable,
        source_row_id: input.sourceRowId ?? null,
        payout_approval_key: input.payoutApprovalKey ?? null,
        payout_terminal_event_key: input.payoutTerminalEventKey ?? null,
        event_metadata: input.eventMetadata ?? {},
        provenance_metadata: provenanceMetadata,
        occurred_at: input.orderingTimestamp,
      },
      { onConflict: "payout_event_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payout_ordering").upsert(
      {
        payout_ordering_key: input.payoutOrderingKey,
        payout_event_key: input.payoutEventKey,
        payout_request_id: input.payoutRequestId ?? null,
        payout_id: input.payoutId ?? null,
        creator_id: input.creatorId,
        lifecycle_stage: input.lifecycleStage,
        lifecycle_sequence: input.lifecycleSequence,
        ordering_surface: "payout.event.replay_ordering",
        ordering_timestamp: input.orderingTimestamp,
        ordering_source: input.orderingSource,
        replay_timestamp_source: input.replayTimestampSource,
        ordering_confidence: input.orderingConfidence,
        ordering_metadata: input.orderingMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "payout_ordering_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payout_provenance").upsert(
      {
        payout_provenance_key: input.payoutProvenanceKey,
        payout_event_key: input.payoutEventKey,
        payout_ordering_key: input.payoutOrderingKey,
        payout_approval_key: input.payoutApprovalKey ?? null,
        payout_terminal_event_key: input.payoutTerminalEventKey ?? null,
        payout_approval_ordering_key: input.payoutApprovalOrderingKey ?? null,
        payout_terminal_ordering_key: input.payoutTerminalOrderingKey ?? null,
        privileged_execution_key: input.privilegedExecutionKey ?? null,
        service_role_execution_key: input.serviceRoleExecutionKey ?? null,
        payout_request_id: input.payoutRequestId ?? null,
        payout_id: input.payoutId ?? null,
        creator_id: input.creatorId,
        lifecycle_stage: input.lifecycleStage,
        provenance_surface: "payout.event.provenance",
        provenance_source: input.provenanceSource,
        provenance_status: input.provenanceStatus,
        source_table: input.sourceTable,
        source_row_id: input.sourceRowId ?? null,
        target_table: input.targetTable ?? null,
        target_row_id: input.targetRowId ?? null,
        lineage_metadata: input.lineageMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "payout_provenance_key" }
    )
  )

  if (input.payoutReconstructionKey != null && input.payoutId != null) {
    await assertNoSupabaseError(
      supabaseAdmin
        .from("canonical_payout_reconstruction_metadata")
        .upsert(
          {
            payout_reconstruction_key: input.payoutReconstructionKey,
            payout_terminal_event_key: input.payoutTerminalEventKey ?? null,
            payout_terminal_ordering_key:
              input.payoutTerminalOrderingKey ?? null,
            payout_event_key: input.payoutEventKey,
            payout_ordering_key: input.payoutOrderingKey,
            payout_provenance_key: input.payoutProvenanceKey,
            payout_id: input.payoutId,
            payout_request_id: input.payoutRequestId ?? null,
            creator_id: input.creatorId,
            reconstruction_status: "observed",
            reconstruction_confidence: input.reconstructionConfidence,
            payout_observed: true,
            payout_request_observed: input.payoutRequestId != null,
            terminal_timestamp_observed:
              input.lifecycleStage === "terminal" &&
              input.orderingTimestamp.trim() !== "",
            earning_linkage_observed: false,
            paid_out_linkage_observed: false,
            runtime_execution_observed: true,
            payout_approval_observed: input.payoutApprovalObserved,
            payout_terminal_event_observed: input.payoutTerminalEventObserved,
            replay_safe_ordering_observed: input.replaySafeOrderingObserved,
            lifecycle_reconstruction_observed:
              input.lifecycleReconstructionObserved,
            lifecycle_reconstruction_confidence:
              input.reconstructionConfidence,
            reconstruction_metadata: {
              lifecycleStage: input.lifecycleStage,
              canonicalPayoutEventTopologyObserved: true,
              runtimePayoutReplacementAllowed: false,
              replayOwnedPayoutMutationAllowed: false,
              reconciliationOwnedPayoutRepairAllowed: false,
            },
            provenance_metadata: provenanceMetadata,
          },
          { onConflict: "payout_reconstruction_key" }
        )
    )
  }
}

export async function writeCanonicalPayoutEventTopologyNoThrow(
  input: CanonicalPayoutEventTopologyInsert
): Promise<void> {
  try {
    await writeCanonicalPayoutEventTopology(input)
  } catch (error) {
    logger.warn({
      event: "payout.traceability.canonical_event_topology.write_failed",
      message: "Canonical payout event topology write failed",
      error,
    })
  }
}
