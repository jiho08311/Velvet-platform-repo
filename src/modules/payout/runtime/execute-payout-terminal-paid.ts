import type { AuditCorrelationContext } from "@/shared/observability/audit-event-types"
import { recordFinancialOperationAudit as createAuditLog } from "@/modules/governance/public/audit-contract"
import { createPayoutPaidLedgerTransaction } from "@/modules/ledger/public/create-payout-paid-ledger-transaction"
import type { PayoutExecutionResult } from "@/modules/payout/contracts/payout-execution-contract"
import type { PayoutTerminalRow } from "@/modules/payout/repositories/payout-read-repository"
import { markEarningRowsAsPaidOutForPayout } from "@/modules/payout/repositories/earning-write-repository"
import { markPayoutRowAsPaid } from "@/modules/payout/repositories/payout-write-repository"
import { verifyPaidPayoutExecutionPostcondition } from "@/modules/payout/services/payout-postcondition-service"
import {
  synchronizePayoutEventTopologyNoThrow,
  synchronizePayoutTerminalProvenanceNoThrow,
  synchronizePrivilegedExecutionTraceabilityNoThrow,
  synchronizeServiceRoleFinancialExecutionTraceabilityNoThrow,
} from "@/modules/payout/traceability"
import { createAndTracePayout } from "@/shared/observability/payout-trace"
import { compensateAndShadowPayoutTerminalRowState } from "./payout-terminal-compensation"

export async function executePayoutTerminalPaid({
  payoutId,
  payout,
  linkedRequestedEarningIds,
  now,
  correlation,
}: {
  payoutId: string
  payout: PayoutTerminalRow
  linkedRequestedEarningIds: string[]
  now: string
  correlation?: AuditCorrelationContext
}): Promise<PayoutExecutionResult> {
  const targetState = "paid"

  await markPayoutRowAsPaid({
    payoutId,
    paidAt: now,
  })

  await createPayoutPaidLedgerTransaction({
    payoutId,
    payoutRequestId: payout.payout_request_id,
    creatorId: payout.creator_id,
    amount: payout.amount,
    currency: payout.currency,
    paidAt: now,
  })

  if (linkedRequestedEarningIds.length > 0) {
    const updatedEarnings = await markEarningRowsAsPaidOutForPayout({
      earningIds: linkedRequestedEarningIds,
      paidOutAt: now,
    }).catch(async (error) => {
      await compensateAndShadowPayoutTerminalRowState({
        payoutId,
        targetState,
        reason: "mark_linked_earnings_paid_out_failed",
        restoredState: {
          status: payout.status,
          paidAt: payout.paid_at,
          failureReason: payout.failure_reason,
        },
        linkedEarningIds: linkedRequestedEarningIds,
      })

      throw error
    })

    if (updatedEarnings.length !== linkedRequestedEarningIds.length) {
      await compensateAndShadowPayoutTerminalRowState({
        payoutId,
        targetState,
        reason: "linked_earnings_paid_out_count_mismatch",
        restoredState: {
          status: payout.status,
          paidAt: payout.paid_at,
          failureReason: payout.failure_reason,
        },
        linkedEarningIds: linkedRequestedEarningIds,
      })

      throw new Error("FAILED_TO_CLOSE_ALL_LINKED_EARNINGS_AS_PAID_OUT")
    }
  }

  await verifyPaidPayoutExecutionPostcondition({
    payoutId,
    earningIds: linkedRequestedEarningIds,
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
    executionSurface: "mark_payout_as_paid",
  })

  await synchronizePayoutEventTopologyNoThrow({
    payoutRequestId: payout.payout_request_id,
    payoutId,
    creatorId: payout.creator_id,
    eventKind: "payout_paid",
    lifecycleStage: "terminal",
    previousPayoutStatus: payout.status,
    nextPayoutStatus: "paid",
    amount: payout.amount,
    currency: payout.currency,
    occurredAt: now,
    runtimeSurface: "payout_execution_service",
    authoritySurface: "mark_payout_as_paid",
    sourceTable: "payouts",
    sourceRowId: payoutId,
    payoutTerminalEventKey: ["payout_terminal_event", "paid", payoutId].join(
      ":"
    ),
    payoutTerminalOrderingKey: [
      "payout_terminal_ordering",
      "paid",
      payoutId,
      20,
    ].join(":"),
    privilegedExecutionKey: [
      "privileged_execution",
      "mark_payout_as_paid",
      payoutId,
      payout.payout_request_id ?? "unknown",
      payoutId,
    ].join(":"),
    serviceRoleExecutionKey: [
      "service_role_financial_execution",
      "mark_payout_as_paid",
      payoutId,
      payout.payout_request_id ?? "unknown",
      payoutId,
    ].join(":"),
    orderingSource: "runtime_payout_terminal_paid",
    replayTimestampSource: "payouts.paid_at",
    eventMetadata: {
      sourceOperation: "executePayoutTerminal",
      linkedEarningCount: linkedRequestedEarningIds.length,
    },
    lineageMetadata: {
      payoutPaidToEarningPaidOutObserved: linkedRequestedEarningIds.length > 0,
    },
    provenanceMetadata: {
      payoutTerminalRuntimeAuthorityPreserved: true,
      payoutRuntimeAuthorityPreserved: true,
      advisoryOnly: true,
    },
  })

  await synchronizePrivilegedExecutionTraceabilityNoThrow({
    invocationSurface: "mark_payout_as_paid",
    definedSecurityDefinerSurface: "mark_payout_as_paid",
    definedSecurityDefinerPresent: true,
    observedSecurityDefinerInvoked: false,
    observedRuntimeSurface: "payout_execution_service.markPayoutRowAsPaid",
    serviceRoleSurface: "service_role.payout_terminal_runtime",
    mutationSurface:
      "payouts.terminal_paid_runtime_mutation+earnings.paid_out_runtime_mutation",
    sourceTable: "payouts",
    sourceRowId: payoutId,
    payoutRequestId: payout.payout_request_id,
    payoutId,
    creatorId: payout.creator_id,
    executionKind: "defined_security_definer_terminal_paid_not_invoked",
    executedAt: now,
    orderingSequence: 20,
    orderingTimestamp: now,
    orderingSource: "runtime_payout_terminal_paid",
    replayTimestampSource: "payouts.paid_at",
    lineage: linkedRequestedEarningIds.map((earningId) => ({
      lineageKind: "runtime_paid_update_to_earning_paid_out",
      sourceTable: "payouts",
      sourceRowId: payoutId,
      targetTable: "earnings",
      targetRowId: earningId,
      lineageMetadata: {
        definedSecurityDefinerSurface: "mark_payout_as_paid",
        observedRuntimeSurface: "payout_execution_service.markPayoutRowAsPaid",
        observedSecurityDefinerInvoked: false,
      },
    })),
    invocationMetadata: {
      sourceOperation: "executePayoutTerminal",
      definedRpcName: "mark_payout_as_paid",
      runtimeRpcReplacementAllowed: false,
    },
    provenanceMetadata: {
      payoutTerminalRuntimeAuthorityPreserved: true,
      securityDefinerDefinitionObserved: true,
      observedRuntimeRemainsAuthoritative: true,
    },
  })

  await synchronizeServiceRoleFinancialExecutionTraceabilityNoThrow({
    executionSurface: "mark_payout_as_paid",
    serviceRoleSurface: "service_role.payout_terminal_runtime",
    runtimeSurface: "payout_execution_service.markPayoutRowAsPaid",
    mutationSurface:
      "payouts.terminal_paid_runtime_mutation+earnings.paid_out_runtime_mutation",
    sourceTable: "payouts",
    sourceRowId: payoutId,
    payoutRequestId: payout.payout_request_id,
    payoutId,
    creatorId: payout.creator_id,
    executionKind: "service_role_financial_payout_terminal_paid",
    executedAt: now,
    orderingSequence: 20,
    orderingTimestamp: now,
    orderingSource: "runtime_service_role_payout_terminal_paid",
    replayTimestampSource: "payouts.paid_at",
    lineage: linkedRequestedEarningIds.map((earningId) => ({
      lineageKind: "service_role_paid_to_earning_paid_out",
      sourceTable: "payouts",
      sourceRowId: payoutId,
      targetTable: "earnings",
      targetRowId: earningId,
      lineageMetadata: {
        serviceRoleRuntimeAuthorityPreserved: true,
        observedRuntimeSurface: "payout_execution_service.markPayoutRowAsPaid",
      },
    })),
    executionMetadata: {
      sourceOperation: "executePayoutTerminal",
      targetState,
    },
    provenanceMetadata: {
      payoutTerminalRuntimeAuthorityPreserved: true,
      serviceRoleRuntimeAuthorityPreserved: true,
      governanceOwnedExecutionAuthorityAllowed: false,
      replayOwnedServiceRoleMutationAllowed: false,
    },
  })

  createAndTracePayout({
    phase: "terminal_paid",
    authority: "payout_terminal_execution",
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
      linkedEarningCount: linkedRequestedEarningIds.length,
    },
  })

  await createAuditLog({
    actorId: null,
    action: "payout_paid",
    targetType: "payout",
    targetId: payoutId,
    metadata: {
      linkedEarningIds: linkedRequestedEarningIds,
    },
    correlation,
  })

  return {
    payoutId,
    targetState,
    linkedEarningIds: linkedRequestedEarningIds,
  }
}
