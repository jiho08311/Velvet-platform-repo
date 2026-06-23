import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalPayoutTerminalLineageInsert = Readonly<{
  payoutTerminalLineageKey: string
  earningId?: string | null
  lineageKind: string
  sourceTable: string
  sourceRowId: string
  targetTable: string
  targetRowId: string
  lineageMetadata?: JsonRecord
}>

export type CanonicalPayoutTerminalProvenanceInsert = Readonly<{
  payoutTerminalEventKey: string
  payoutTerminalOrderingKey: string
  payoutParityKey: string
  payoutReconstructionKey: string
  payoutId: string
  payoutRequestId?: string | null
  creatorId: string
  terminalEventKind: string
  terminalStatus: string
  previousPayoutStatus: string
  nextPayoutStatus: string
  amount?: number | null
  currency: string
  runtimeSurface: string
  executionSurface: string
  terminalAt: string
  terminalSequence: number
  orderingTimestamp: string
  orderingSource: string
  replayTimestampSource: string
  orderingConfidence: string
  parityStatus: string
  parityConfidence: string
  linkedEarningCount: number
  expectedTerminalStatus: string
  observedTerminalStatus: string
  expectedEarningStatus?: string | null
  earningLinkageObserved: boolean
  earningPaidOutLinkageObserved: boolean
  reconstructionStatus: string
  reconstructionConfidence: string
  payoutObserved: boolean
  payoutRequestObserved: boolean
  terminalTimestampObserved: boolean
  paidOutLinkageObserved: boolean
  runtimeExecutionObserved: boolean
  lineage: readonly CanonicalPayoutTerminalLineageInsert[]
  terminalEventMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  parityMetadata?: JsonRecord
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

export async function writeCanonicalPayoutTerminalProvenance(
  input: CanonicalPayoutTerminalProvenanceInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-016",
    aggregateRoot: "canonical_payout_terminal_event.id",
    runtimeAuthoritative: true,
    payoutRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    payoutTerminalRuntimeAuthorityPreserved: true,
    payoutExecutionServiceAuthoritative: true,
    markPayoutAsPaidAuthoritative: true,
    payoutWriteRepositoryAuthoritative: true,
    earningWriteRepositoryAuthoritative: true,
    payoutExecutionTransferAllowed: false,
    shadowPayoutExecutionAllowed: false,
    replayMutationAllowed: false,
    replayOwnedExecutionAllowed: false,
    reconciliationRepairAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payout_terminal_events").upsert(
      {
        payout_terminal_event_key: input.payoutTerminalEventKey,
        payout_id: input.payoutId,
        payout_request_id: input.payoutRequestId ?? null,
        creator_id: input.creatorId,
        terminal_event_kind: input.terminalEventKind,
        terminal_status: input.terminalStatus,
        previous_payout_status: input.previousPayoutStatus,
        next_payout_status: input.nextPayoutStatus,
        amount: input.amount ?? null,
        currency: input.currency,
        runtime_surface: input.runtimeSurface,
        execution_surface: input.executionSurface,
        source_table: "payouts",
        source_row_id: input.payoutId,
        terminal_event_metadata: input.terminalEventMetadata ?? {},
        provenance_metadata: provenanceMetadata,
        terminal_at: input.terminalAt,
      },
      { onConflict: "payout_terminal_event_key" }
    )
  )

  for (const lineage of input.lineage) {
    await assertNoSupabaseError(
      supabaseAdmin.from("canonical_payout_terminal_lineage").upsert(
        {
          payout_terminal_lineage_key: lineage.payoutTerminalLineageKey,
          payout_terminal_event_key: input.payoutTerminalEventKey,
          payout_id: input.payoutId,
          payout_request_id: input.payoutRequestId ?? null,
          creator_id: input.creatorId,
          earning_id: lineage.earningId ?? null,
          lineage_kind: lineage.lineageKind,
          lineage_status: "observed",
          runtime_surface: input.runtimeSurface,
          source_table: lineage.sourceTable,
          source_row_id: lineage.sourceRowId,
          target_table: lineage.targetTable,
          target_row_id: lineage.targetRowId,
          lineage_metadata: lineage.lineageMetadata ?? {},
          provenance_metadata: provenanceMetadata,
        },
        { onConflict: "payout_terminal_lineage_key" }
      )
    )
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payout_terminal_ordering").upsert(
      {
        payout_terminal_ordering_key: input.payoutTerminalOrderingKey,
        payout_terminal_event_key: input.payoutTerminalEventKey,
        payout_id: input.payoutId,
        payout_request_id: input.payoutRequestId ?? null,
        creator_id: input.creatorId,
        terminal_sequence: input.terminalSequence,
        ordering_timestamp: input.orderingTimestamp,
        ordering_source: input.orderingSource,
        replay_timestamp_source: input.replayTimestampSource,
        ordering_confidence: input.orderingConfidence,
        ordering_metadata: input.orderingMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "payout_terminal_ordering_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payout_parity_metadata").upsert(
      {
        payout_parity_key: input.payoutParityKey,
        payout_terminal_event_key: input.payoutTerminalEventKey,
        payout_id: input.payoutId,
        payout_request_id: input.payoutRequestId ?? null,
        creator_id: input.creatorId,
        parity_status: input.parityStatus,
        parity_confidence: input.parityConfidence,
        linked_earning_count: input.linkedEarningCount,
        expected_terminal_status: input.expectedTerminalStatus,
        observed_terminal_status: input.observedTerminalStatus,
        expected_earning_status: input.expectedEarningStatus ?? null,
        earning_linkage_observed: input.earningLinkageObserved,
        earning_paid_out_linkage_observed: input.earningPaidOutLinkageObserved,
        parity_metadata: input.parityMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "payout_parity_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payout_reconstruction_metadata").upsert(
      {
        payout_reconstruction_key: input.payoutReconstructionKey,
        payout_terminal_event_key: input.payoutTerminalEventKey,
        payout_terminal_ordering_key: input.payoutTerminalOrderingKey,
        payout_id: input.payoutId,
        payout_request_id: input.payoutRequestId ?? null,
        creator_id: input.creatorId,
        reconstruction_status: input.reconstructionStatus,
        reconstruction_confidence: input.reconstructionConfidence,
        payout_observed: input.payoutObserved,
        payout_request_observed: input.payoutRequestObserved,
        terminal_timestamp_observed: input.terminalTimestampObserved,
        earning_linkage_observed: input.earningLinkageObserved,
        paid_out_linkage_observed: input.paidOutLinkageObserved,
        runtime_execution_observed: input.runtimeExecutionObserved,
        reconstruction_metadata: input.reconstructionMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "payout_reconstruction_key" }
    )
  )
}

export async function writeCanonicalPayoutTerminalProvenanceNoThrow(
  input: CanonicalPayoutTerminalProvenanceInsert
): Promise<void> {
  try {
    await writeCanonicalPayoutTerminalProvenance(input)
  } catch (error) {
    logger.warn({
      event: "payout.traceability.canonical_terminal_provenance.write_failed",
      message: "Canonical payout terminal provenance write failed",
      error,
    })
  }
}
