import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalPayoutApprovalLineageInsert = Readonly<{
  payoutApprovalLineageKey: string
  lineageKind: string
  sourceTable: string
  sourceRowId: string
  targetTable: string
  targetRowId: string
  earningId?: string | null
  lineageMetadata?: JsonRecord
}>

export type CanonicalPayoutApprovalProvenanceInsert = Readonly<{
  payoutApprovalKey: string
  payoutApprovalOrderingKey: string
  payoutApprovalReconstructionKey: string
  privilegedExecutionKey: string
  payoutRequestId: string
  payoutId: string
  creatorId: string
  amount: number
  currency: string
  payoutRequestStatus: string
  payoutStatus: string
  approvedAt: string
  runtimeSurface: string
  privilegedExecutionSurface: string
  approvalStatus: string
  approvalSequence: number
  orderingTimestamp: string
  orderingSource: string
  replayTimestampSource: string
  orderingConfidence: string
  reconstructionStatus: string
  reconstructionConfidence: string
  payoutRequestObserved: boolean
  payoutObserved: boolean
  earningAttachmentObserved: boolean
  approvalTimestampObserved: boolean
  privilegedExecutionObserved: boolean
  lineage: readonly CanonicalPayoutApprovalLineageInsert[]
  approvalMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  privilegedExecutionMetadata?: JsonRecord
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

export async function writeCanonicalPayoutApprovalProvenance(
  input: CanonicalPayoutApprovalProvenanceInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-015",
    aggregateRoot: "canonical_payout_approval.id",
    runtimeAuthoritative: true,
    payoutRuntimeAuthoritative: true,
    privilegedExecutionRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    payoutApprovalRuntimeAuthorityPreserved: true,
    payoutRequestServiceAuthoritative: true,
    securityDefinerPayoutApprovalAuthoritative: true,
    payoutExecutionTransferAllowed: false,
    privilegedExecutionReplacementAllowed: false,
    replayMutationAllowed: false,
    replayOwnedExecutionAllowed: false,
    reconciliationRepairAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payout_approvals").upsert(
      {
        payout_approval_key: input.payoutApprovalKey,
        payout_request_id: input.payoutRequestId,
        payout_id: input.payoutId,
        creator_id: input.creatorId,
        amount: input.amount,
        currency: input.currency,
        approval_status: input.approvalStatus,
        payout_request_status: input.payoutRequestStatus,
        payout_status: input.payoutStatus,
        runtime_surface: input.runtimeSurface,
        privileged_execution_surface: input.privilegedExecutionSurface,
        source_table: "payout_requests",
        source_row_id: input.payoutRequestId,
        payout_table: "payouts",
        payout_row_id: input.payoutId,
        approval_metadata: input.approvalMetadata ?? {},
        provenance_metadata: provenanceMetadata,
        approved_at: input.approvedAt,
      },
      { onConflict: "payout_approval_key" }
    )
  )

  for (const lineage of input.lineage) {
    await assertNoSupabaseError(
      supabaseAdmin.from("canonical_payout_approval_lineage").upsert(
        {
          payout_approval_lineage_key: lineage.payoutApprovalLineageKey,
          payout_approval_key: input.payoutApprovalKey,
          payout_request_id: input.payoutRequestId,
          payout_id: input.payoutId,
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
        { onConflict: "payout_approval_lineage_key" }
      )
    )
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payout_approval_ordering").upsert(
      {
        payout_approval_ordering_key: input.payoutApprovalOrderingKey,
        payout_approval_key: input.payoutApprovalKey,
        payout_request_id: input.payoutRequestId,
        payout_id: input.payoutId,
        creator_id: input.creatorId,
        approval_sequence: input.approvalSequence,
        ordering_timestamp: input.orderingTimestamp,
        ordering_source: input.orderingSource,
        replay_timestamp_source: input.replayTimestampSource,
        ordering_confidence: input.orderingConfidence,
        ordering_metadata: input.orderingMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "payout_approval_ordering_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payout_approval_reconstruction_metadata").upsert(
      {
        payout_approval_reconstruction_key:
          input.payoutApprovalReconstructionKey,
        payout_approval_key: input.payoutApprovalKey,
        payout_approval_ordering_key: input.payoutApprovalOrderingKey,
        payout_request_id: input.payoutRequestId,
        payout_id: input.payoutId,
        creator_id: input.creatorId,
        reconstruction_status: input.reconstructionStatus,
        reconstruction_confidence: input.reconstructionConfidence,
        payout_request_observed: input.payoutRequestObserved,
        payout_observed: input.payoutObserved,
        earning_attachment_observed: input.earningAttachmentObserved,
        approval_timestamp_observed: input.approvalTimestampObserved,
        privileged_execution_observed: input.privilegedExecutionObserved,
        reconstruction_metadata: input.reconstructionMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "payout_approval_reconstruction_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payout_privileged_execution_metadata").upsert(
      {
        privileged_execution_key: input.privilegedExecutionKey,
        payout_approval_key: input.payoutApprovalKey,
        payout_request_id: input.payoutRequestId,
        payout_id: input.payoutId,
        creator_id: input.creatorId,
        privileged_execution_surface: input.privilegedExecutionSurface,
        execution_kind: "security_definer_payout_approval",
        execution_status: "observed",
        service_role_surface: "service_role.payout_rpc_execution",
        mutation_surface: "payout_requests.approval_runtime_mutation",
        privileged_execution_metadata: input.privilegedExecutionMetadata ?? {},
        provenance_metadata: provenanceMetadata,
        executed_at: input.approvedAt,
      },
      { onConflict: "privileged_execution_key" }
    )
  )
}

export async function writeCanonicalPayoutApprovalProvenanceNoThrow(
  input: CanonicalPayoutApprovalProvenanceInsert
): Promise<void> {
  try {
    await writeCanonicalPayoutApprovalProvenance(input)
  } catch (error) {
    logger.warn({
      event: "payout.traceability.canonical_approval_provenance.write_failed",
      message: "Canonical payout approval provenance write failed",
      error,
    })
  }
}
