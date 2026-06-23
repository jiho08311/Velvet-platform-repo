import {
  synchronizeEarningCreationProvenanceNoThrow,
  synchronizeSettlementAllocationLineageNoThrow,
  synchronizeSettlementEventTopologyNoThrow,
} from "@/modules/payout/traceability"
import type { Earning } from "../types"
import type { EarningCreationResult } from "@/modules/payout/contracts/earning-mutation-contract"
import { recordFinancialOperationAudit as createAuditLog } from "@/modules/governance/public/audit-contract"
import {
  findEarningByPaymentId,
  type EarningRow,
} from "@/modules/payout/repositories/earning-read-repository"
import { insertEarningCreationRow } from "@/modules/payout/repositories/earning-write-repository"
import { getPaymentForEarning } from "@/modules/payment/public/get-payment-for-earning"
import { resolveEarningCreationEligibility } from "@/modules/payout/policies/earning-creation-policy"
import { buildEarningCreationValues } from "@/modules/payout/services/earning-creation-service"
import { InfrastructureError } from "@/shared/errors"

type CreateEarningInput = {
  paymentId: string
}

function toEarning(row: EarningRow): Earning {
  return {
    id: row.id,
    creatorId: row.creator_id,
    paymentId: row.payment_id,
    payoutId: row.payout_id,
    sourceType: row.source_type,
    grossamount: row.gross_amount,
    feeRateBps: row.fee_rate_bps,
    feeamount: row.fee_amount,
    netamount: row.net_amount,
    currency: row.currency,
    status: row.status,
    availableAt: row.available_at,
    paidOutAt: row.paid_out_at,
    reversedAt: row.reversed_at,
    createdAt: row.created_at,
  }
}

export async function executeEarningCreation({
  paymentId,
}: CreateEarningInput): Promise<EarningCreationResult["earning"]> {
  const id = paymentId.trim()

  if (!id) {
    throw new InfrastructureError("EARNING_CREATION_PAYMENT_ID_REQUIRED")
  }

  const existingEarning = await findEarningByPaymentId(id)

  if (existingEarning) {
    return toEarning(existingEarning)
  }

  const payment = await getPaymentForEarning(id)

  if (!payment) {
    throw new InfrastructureError("EARNING_CREATION_PAYMENT_NOT_FOUND", {
      metadata: {
        paymentId: id,
      },
    })
  }

  const eligibility = resolveEarningCreationEligibility(payment)

  if (!eligibility) {
    return null
  }

  const creationValues = buildEarningCreationValues({
    payment,
    eligibility,
  })

  const data = await insertEarningCreationRow(creationValues.insertPayload)

  await synchronizeEarningCreationProvenanceNoThrow({
    paymentId: data.payment_id,
    earningId: data.id,
    creatorId: data.creator_id,
    sourceType: data.source_type,
    earningStatus: data.status,
    grossAmount: data.gross_amount,
    feeRateBps: data.fee_rate_bps,
    feeAmount: data.fee_amount,
    netAmount: data.net_amount,
    currency: data.currency,
    availableAt: data.available_at ?? creationValues.insertPayload.available_at,
    earningCreatedAt: data.created_at,
    runtimeSurface: "earning_creation_server",
    settlementStatus: "observed",
    settlementMetadata: {
      paymentId: payment.id,
      creatorId: eligibility.creatorId,
      sourceType: eligibility.sourceType,
    },
    earningMetadata: {
      feeRateBps: creationValues.feeRateBps,
      feeAmount: creationValues.feeamount,
      netAmount: creationValues.netamount,
      currency: creationValues.currency,
    },
    provenanceMetadata: {
      earningCreationRuntimeAuthorityPreserved: true,
      earningsMutableSettlementStatePreserved: true,
    },
  })

  await synchronizeSettlementEventTopologyNoThrow({
    paymentId: data.payment_id,
    earningId: data.id,
    creatorId: data.creator_id,
    sourceType: data.source_type,
    earningStatus: data.status,
    grossAmount: data.gross_amount,
    feeAmount: data.fee_amount,
    netAmount: data.net_amount,
    availableAt: data.available_at ?? creationValues.insertPayload.available_at,
    earningCreatedAt: data.created_at,
    runtimeSurface: "earning_creation_server",
    orderingSource: "earning_creation_server.insert_earnings",
    replayTimestampSource: "earnings.created_at",
    provenanceSource: "runtime_earning_creation",
    provenanceStatus: "observed",
    orderingMetadata: {
      paymentId: payment.id,
      sourceType: eligibility.sourceType,
    },
    lineageMetadata: {
      paymentToEarningRuntimeObserved: true,
    },
    reconstructionMetadata: {
      earningStatus: data.status,
      payoutEligibilityRuntimeObserved: true,
    },
    provenanceMetadata: {
      earningLifecycleRuntimeAuthorityPreserved: true,
      earningsMutableSettlementStatePreserved: true,
      payoutEligibilityRuntimeAuthorityPreserved: true,
    },
  })

  await synchronizeSettlementAllocationLineageNoThrow({
    allocationStage: "earning_created",
    paymentId: data.payment_id,
    earningId: data.id,
    creatorId: data.creator_id,
    sourceType: data.source_type,
    runtimeSurface: "earning_creation_server",
    allocationSource: "earning_creation_server.insert_earnings",
    allocationStatus: "observed",
    orderingTimestamp: data.created_at,
    orderingSource: "earning_creation_server.insert_earnings",
    replayTimestampSource: "earnings.created_at",
    eligibilityState: "earning_pending_release_observed",
    eligibilityObserved: data.status === "pending" && data.available_at != null,
    lineageMetadata: {
      paymentToEarningRuntimeObserved: true,
      allocationSeedOnly: true,
    },
    orderingMetadata: {
      paymentId: payment.id,
      sourceType: eligibility.sourceType,
    },
    eligibilityMetadata: {
      earningStatus: data.status,
      availableAt: data.available_at ?? creationValues.insertPayload.available_at,
      payoutEligibilityRuntimeAuthorityPreserved: true,
    },
    reconstructionMetadata: {
      earningStatus: data.status,
      payoutRequestObserved: false,
    },
    provenanceMetadata: {
      earningAllocationRuntimeAuthorityPreserved: true,
      payoutEligibilityRuntimeAuthorityPreserved: true,
    },
  })

  await createAuditLog({
    actorId: eligibility.creatorId,
    action: "earning_created",
    targetType: "earning",
    targetId: data.id,
    metadata: {
      paymentId: payment.id,
      creatorId: eligibility.creatorId,
      sourceType: eligibility.sourceType,
      grossAmount: eligibility.grossamount,
      feeRateBps: creationValues.feeRateBps,
      feeAmount: creationValues.feeamount,
      netAmount: creationValues.netamount,
      currency: creationValues.currency,
    },
  })

  return toEarning(data)
}