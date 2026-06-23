import type { AuditCorrelationContext } from "@/shared/observability/audit-event-types"
import { recordFinancialOperationAudit as createAuditLog } from "@/modules/governance/public/audit-contract"
import type { PayoutExecutionResult } from "@/modules/payout/contracts/payout-execution-contract"
import type { PayoutTerminalRow } from "@/modules/payout/repositories/payout-read-repository"
import { releaseEarningRowsForFailedPayout } from "@/modules/payout/repositories/earning-write-repository"
import { markPayoutRowAsFailed } from "@/modules/payout/repositories/payout-write-repository"
import { verifyFailedPayoutExecutionPostcondition } from "@/modules/payout/services/payout-postcondition-service"
import {
  synchronizePayoutEventTopologyNoThrow,
  synchronizePayoutTerminalProvenanceNoThrow,
  synchronizeServiceRoleFinancialExecutionTraceabilityNoThrow,
} from "@/modules/payout/traceability"
import { createAndTracePayout } from "@/shared/observability/payout-trace"
import { compensateAndShadowPayoutTerminalRowState } from "./payout-terminal-compensation"

export async function executePayoutTerminalFailed({
  payoutId,
  payout,
  linkedRequestedEarningIds,
  now,
  failureReason,
  correlation,
}: {
  payoutId: string
  payout: PayoutTerminalRow
  linkedRequestedEarningIds: string[]
  now: string
  failureReason?: string
  correlation?: AuditCorrelationContext
}): Promise<PayoutExecutionResult> {
  const targetState = "failed"
  const normalizedFailureReason =
    failureReason?.trim() || "Marked as failed by admin"

  await markPayoutRowAsFailed({
    payoutId,
    failureReason: normalizedFailureReason,
  })

  if (linkedRequestedEarningIds.length > 0) {
    const releasedEarnings = await releaseEarningRowsForFailedPayout(
      linkedRequestedEarningIds
    ).catch(async (error) => {
      await compensateAndShadowPayoutTerminalRowState({
        payoutId,
        targetState,
        reason: "release_linked_earnings_for_failed_payout_failed",
        restoredState: {
          status: payout.status,
          paidAt: payout.paid_at,
          failureReason: payout.failure_reason,
        },
        linkedEarningIds: linkedRequestedEarningIds,
      })

      throw error
    })

    if (releasedEarnings.length !== linkedRequestedEarningIds.length) {
      await compensateAndShadowPayoutTerminalRowState({
        payoutId,
        targetState,
        reason: "released_earnings_count_mismatch",
        restoredState: {
          status: payout.status,
          paidAt: payout.paid_at,
          failureReason: payout.failure_reason,
        },
        linkedEarningIds: linkedRequestedEarningIds,
      })

      throw new Error("FAILED_TO_RELEASE_ALL_LINKED_EARNINGS")
    }
  }

  await verifyFailedPayoutExecutionPostcondition({
    payoutId,
    releasedEarningIds: linkedRequestedEarningIds,
  })

  await synchronizePayoutTerminalProvenanceNoThrow({
    payoutId,
    payoutRequestId: payout.payout_request_id,
    creatorId: payout.creator_id,
    targetState,
    previousPayoutStatus: payout.status,
    amount: payout.amount,
    currency: payout.currency,
    terminalAt: now,
    linkedEarningIds: linkedRequestedEarningIds,
    failureReason: normalizedFailureReason,
    executionSurface: "payout_execution_service.mark_failed",
  })

  await synchronizePayoutEventTopologyNoThrow({
    payoutRequestId: payout.payout_request_id,
    payoutId,
    creatorId: payout.creator_id,
    eventKind: "payout_failed",
    lifecycleStage: "terminal",
    previousPayoutStatus: payout.status,
    nextPayoutStatus: "failed",
    amount: payout.amount,
    currency: payout.currency,
    occurredAt: now,
    runtimeSurface: "payout_execution_service",
    authoritySurface: "payout_execution_service.mark_failed",
    sourceTable: "payouts",
    sourceRowId: payoutId,
    payoutTerminalEventKey: ["payout_terminal_event", "failed", payoutId].join(
      ":"
    ),
    payoutTerminalOrderingKey: [
      "payout_terminal_ordering",
      "failed",
      payoutId,
      20,
    ].join(":"),
    serviceRoleExecutionKey: [
      "service_role_financial_execution",
      "payout_execution_service.mark_failed",
      payoutId,
      payout.payout_request_id ?? "unknown",
      payoutId,
    ].join(":"),
    orderingSource: "runtime_payout_terminal_failed",
    replayTimestampSource: "payouts.failure_reason",
    eventMetadata: {
      sourceOperation: "executePayoutTerminal",
      failureReason: normalizedFailureReason,
      linkedEarningCount: linkedRequestedEarningIds.length,
    },
    lineageMetadata: {
      payoutFailedToEarningReleaseObserved: linkedRequestedEarningIds.length > 0,
    },
    provenanceMetadata: {
      payoutTerminalRuntimeAuthorityPreserved: true,
      payoutRuntimeAuthorityPreserved: true,
      advisoryOnly: true,
    },
  })

  await synchronizeServiceRoleFinancialExecutionTraceabilityNoThrow({
    executionSurface: "payout_execution_service.mark_failed",
    serviceRoleSurface: "service_role.payout_terminal_runtime",
    runtimeSurface: "payout_execution_service.markPayoutRowAsFailed",
    mutationSurface:
      "payouts.terminal_failed_runtime_mutation+earnings.release_runtime_mutation",
    sourceTable: "payouts",
    sourceRowId: payoutId,
    payoutRequestId: payout.payout_request_id,
    payoutId,
    creatorId: payout.creator_id,
    executionKind: "service_role_financial_payout_terminal_failed",
    executedAt: now,
    orderingSequence: 30,
    orderingTimestamp: now,
    orderingSource: "runtime_service_role_payout_terminal_failed",
    replayTimestampSource: "payouts.failure_reason",
    lineage: linkedRequestedEarningIds.map((earningId) => ({
      lineageKind: "service_role_failed_to_earning_release",
      sourceTable: "payouts",
      sourceRowId: payoutId,
      targetTable: "earnings",
      targetRowId: earningId,
      lineageMetadata: {
        serviceRoleRuntimeAuthorityPreserved: true,
        observedRuntimeSurface:
          "payout_execution_service.markPayoutRowAsFailed",
      },
    })),
    executionMetadata: {
      sourceOperation: "executePayoutTerminal",
      targetState,
      failureReason: normalizedFailureReason,
    },
    provenanceMetadata: {
      payoutTerminalRuntimeAuthorityPreserved: true,
      serviceRoleRuntimeAuthorityPreserved: true,
      governanceOwnedExecutionAuthorityAllowed: false,
      replayOwnedServiceRoleMutationAllowed: false,
    },
  })

  createAndTracePayout({
    phase: "terminal_failed",
    authority: "payout_terminal_failure",
    payoutId,
    actor: {
      actorType: "system",
      actorId: null,
    },
    correlation,
    linkedEarningIds: linkedRequestedEarningIds,
    source: {
      sourceFile: "src/modules/payout/services/payout-execution-service.ts",
      operationName: "executePayoutTerminal",
    },
    metadata: {
      targetState,
      failureReason: normalizedFailureReason,
      linkedEarningCount: linkedRequestedEarningIds.length,
    },
  })

  await createAuditLog({
    actorId: null,
    action: "payout_failed",
    targetType: "payout",
    targetId: payoutId,
    metadata: {
      linkedEarningIds: linkedRequestedEarningIds,
      failureReason: normalizedFailureReason,
    },
    correlation,
  })

  return {
    payoutId,
    targetState,
    linkedEarningIds: linkedRequestedEarningIds,
  }
}
