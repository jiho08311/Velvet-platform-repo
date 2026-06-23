import type {
  PayoutRequestCreationResult,
} from "@/modules/payout/contracts/payout-request-contract"

import {
  listRequestableEarningSnapshotRows,
} from "@/modules/payout/repositories/earning-read-repository"

import {
  lockEarningRowsForPayoutRequest,
} from "@/modules/payout/repositories/earning-write-repository"

import {
  insertPayoutRequestRow,
} from "@/modules/payout/repositories/payout-request-write-repository"

import {
  assertPayoutRequestEligibility,
} from "@/modules/payout/policies/payout-request-eligibility-policy"

import {
  filterRequestableEarnings,
} from "@/modules/payout/policies/payout-balance-policy"

import {
  compensateCreatedPayoutRequest,
} from "@/modules/payout/services/payout-compensation-service"

import {
  synchronizeSettlementAllocationLineageNoThrow,
  synchronizePayoutEligibilityProvenanceNoThrow,
} from "@/modules/payout/traceability"

import { createPayoutRequestLedgerHold } from "@/modules/ledger/public/create-payout-request-ledger-hold"
import { getLedgerCreatorBalanceRow } from "@/modules/ledger/public/creator-balance-read-model"
import { resolveLedgerCreatorBalanceTotals } from "@/modules/ledger/public/ledger-balance-policy"

export async function executePayoutRequestAllocation({
  creatorId,
  requestedAmount,
  currency,
  accountReadinessState,
}: {
  creatorId: string
  requestedAmount: number | null
  currency: string
  accountReadinessState: "ready" | "missing"
}): Promise<PayoutRequestCreationResult> {
  const earningsSnapshot = await listRequestableEarningSnapshotRows(creatorId)
  const requestableEarnings = filterRequestableEarnings(earningsSnapshot)

  const ledgerBalanceRow = await getLedgerCreatorBalanceRow(creatorId)
  const ledgerBalanceTotals =
    resolveLedgerCreatorBalanceTotals(ledgerBalanceRow)

  const requestableAmount = ledgerBalanceTotals.requestableAmount
  const resolvedRequestedAmount = requestedAmount ?? requestableAmount

  assertPayoutRequestEligibility({
    accountReadinessState,
    requestedAmount: resolvedRequestedAmount,
    availableBalance: requestableAmount,
  })

  if (requestedAmount !== null && requestedAmount !== requestableAmount) {
    throw new Error("PAYOUT_REQUEST_AMOUNT_MUST_MATCH_AVAILABLE_BALANCE")
  }

  const selectedEarningIds = requestableEarnings.map((earning) => earning.id)

  if (selectedEarningIds.length === 0) {
    throw new Error("NOT_ENOUGH_EARNINGS")
  }

  const payoutRequest = await insertPayoutRequestRow({
    creatorId,
    amount: requestableAmount,
    currency,
  })

  try {
    const ledgerHoldResult = await createPayoutRequestLedgerHold({
      creatorId,
      payoutRequestId: payoutRequest.id,
      amount: resolvedRequestedAmount,
      currency: payoutRequest.currency,
      occurredAt: payoutRequest.created_at,
    })

    const updatedEarnings = await lockEarningRowsForPayoutRequest({
      creatorId,
      payoutRequestId: payoutRequest.id,
      earningIds: selectedEarningIds,
    })

    if (updatedEarnings.length !== selectedEarningIds.length) {
      throw new Error("FAILED_TO_LOCK_EARNINGS_FOR_PAYOUT_REQUEST")
    }

    const lockedEarningIds = updatedEarnings.map((earning) => earning.id)
    const lockedAt = new Date().toISOString()

    await synchronizeSettlementAllocationLineageNoThrow({
      allocationStage: "payout_request_locked",
      creatorId: payoutRequest.creator_id,
      earningIds: lockedEarningIds,
      payoutRequestId: payoutRequest.id,
      runtimeSurface: "payout_request_allocation_runtime",
      allocationSource: "payout_request_service.lock_earnings",
      allocationStatus: "observed",
      orderingTimestamp: lockedAt,
      orderingSource: "payout_request_service.lock_earnings",
      replayTimestampSource: "payout_requests.created_at",
      requestedAmount: resolvedRequestedAmount,
      requestableAmount,
      currency: payoutRequest.currency,
      accountReadinessState,
      eligibilityState: "eligible",
      eligibilityObserved: true,
      lineageMetadata: {
        selectedEarningIds,
        lockedEarningIds,
        payoutRequestRuntimeObserved: true,
        ledgerTransactionId: ledgerHoldResult.transaction.id,
        ledgerHoldId: ledgerHoldResult.hold.id,
        ledgerHoldObserved: true,
        ledgerBalanceSource: "ledger_entries",
        earningLockMode: "legacy_compatibility_projection",
      },
      orderingMetadata: {
        selectedEarningCount: selectedEarningIds.length,
        lockedEarningCount: lockedEarningIds.length,
      },
      eligibilityMetadata: {
        requestedAmount: resolvedRequestedAmount,
        availableBalance: requestableAmount,
        accountReadinessState,
        ledgerTransactionId: ledgerHoldResult.transaction.id,
        ledgerHoldId: ledgerHoldResult.hold.id,
      },
      reconstructionMetadata: {
        allocationMatchesSelectedEarnings:
          lockedEarningIds.length === selectedEarningIds.length,
        ledgerHoldObserved: true,
      },
      provenanceMetadata: {
        earningAllocationRuntimeAuthorityPreserved: true,
        payoutEligibilityRuntimeAuthorityPreserved: true,
        ledgerAuthorityPreserved: true,
      },
    })

    await synchronizePayoutEligibilityProvenanceNoThrow({
      creatorId: payoutRequest.creator_id,
      payoutRequestId: payoutRequest.id,
      earningIds: lockedEarningIds,
      requestedAmount: resolvedRequestedAmount,
      requestableAmount,
      currency: payoutRequest.currency,
      accountReadinessState,
      eligibilityState: "eligible",
      eligibilityObserved: true,
      orderingTimestamp: lockedAt,
      orderingSource: "payout_request_service.lock_earnings",
      replayTimestampSource: "payout_requests.created_at",
      requestableEarningCount: requestableEarnings.length,
      lockedEarningCount: lockedEarningIds.length,
      decisionMetadata: {
        requestedAmount: resolvedRequestedAmount,
        availableBalance: requestableAmount,
        accountReadinessState,
        ledgerBalanceSource: "ledger_entries",
      },
      lineageMetadata: {
        selectedEarningIds,
        lockedEarningIds,
        payoutRequestRuntimeObserved: true,
        ledgerTransactionId: ledgerHoldResult.transaction.id,
        ledgerHoldId: ledgerHoldResult.hold.id,
        ledgerHoldObserved: true,
        earningLockMode: "legacy_compatibility_projection",
      },
      orderingMetadata: {
        selectedEarningCount: selectedEarningIds.length,
        lockedEarningCount: lockedEarningIds.length,
      },
      linkageMetadata: {
        allocationMatchesSelectedEarnings:
          lockedEarningIds.length === selectedEarningIds.length,
        ledgerHoldObserved: true,
      },
      reconstructionMetadata: {
        eligibilityRuntimeObserved: true,
        settlementLinkageObserved: lockedEarningIds.length > 0,
        ledgerHoldObserved: true,
      },
      provenanceMetadata: {
        earningsMutableSettlementAuthorityPreserved: true,
        payoutEligibilityRuntimeAuthorityPreserved: true,
        ledgerAuthorityPreserved: true,
      },
    })
  } catch (error) {
    await compensateCreatedPayoutRequest(payoutRequest.id)
    throw error
  }

  return {
    payoutRequestId: payoutRequest.id,
    id: payoutRequest.id,
    creatorId: payoutRequest.creator_id,
    amount: payoutRequest.amount,
    currency: payoutRequest.currency,
    status: payoutRequest.status,
    createdAt: payoutRequest.created_at,
    lockedEarningIds: selectedEarningIds,
  }
}
