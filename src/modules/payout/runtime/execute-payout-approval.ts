import { assertApprovablePayoutRequest } from "@/modules/payout/policies/payout-request-lifecycle-policy"
import type { PayoutApprovalResult } from "@/modules/payout/contracts/payout-approval-contract"
import {
  executeApprovePayoutRequestRpc,
  findPayoutRequestLifecycleRowOrThrow,
} from "@/modules/payout/repositories/payout-request-write-repository"
import { findApprovedPayoutRequestShadowRowOrThrow } from "@/modules/payout/repositories/payout-request-read-repository"
import { findPendingPayoutShadowRowByRequestIdOrThrow } from "@/modules/payout/repositories/payout-read-repository"
import { listPayoutRequestLinkedEarningRows } from "@/modules/payout/repositories/earning-read-repository"
import { verifyApprovedPayoutRequestPostcondition } from "@/modules/payout/services/payout-postcondition-service"

import {
  synchronizePayoutEventTopologyNoThrow,

  synchronizePrivilegedExecutionTraceabilityNoThrow,
  synchronizeServiceRoleFinancialExecutionTraceabilityNoThrow,
} from "@/modules/payout/traceability"

export async function executePayoutApproval({
  payoutRequestId,
}: {
  payoutRequestId: string
}): Promise<PayoutApprovalResult> {
  const payoutRequest =
    await findPayoutRequestLifecycleRowOrThrow(payoutRequestId)

  assertApprovablePayoutRequest({
    payoutRequestStatus: payoutRequest.status,
  })

  const rows = await executeApprovePayoutRequestRpc(payoutRequestId)

  if (rows.length === 0) {
    throw new Error("FAILED_TO_APPROVE_PAYOUT_REQUEST")
  }

  const approvedRow = rows[0]

  const [approvedRequest, pendingPayout, linkedEarnings] = await Promise.all([
    findApprovedPayoutRequestShadowRowOrThrow(payoutRequestId),
    findPendingPayoutShadowRowByRequestIdOrThrow(payoutRequestId),
    listPayoutRequestLinkedEarningRows(payoutRequestId),
  ])

  const attachedEarnings = linkedEarnings.filter(
    (earning) => earning.payout_id === pendingPayout.id
  )
  const attachedEarningIds = attachedEarnings.map((earning) => earning.id)



  await synchronizePayoutEventTopologyNoThrow({
    payoutRequestId: approvedRequest.id,
    payoutId: pendingPayout.id,
    creatorId: approvedRequest.creator_id,
    eventKind: "payout_approved",
    lifecycleStage: "approval",
    previousPayoutStatus: "pending",
    nextPayoutStatus: pendingPayout.status,
    amount: approvedRequest.amount,
    currency: approvedRequest.currency,
    occurredAt: approvedRequest.approved_at,
    runtimeSurface: "payout_request_service",
    authoritySurface: "approve_payout_request_and_create_payout",
    sourceTable: "payout_requests",
    sourceRowId: approvedRequest.id,
    targetTable: "payouts",
    targetRowId: pendingPayout.id,
    payoutApprovalKey: [
      "payout_approval",
      approvedRequest.id,
      pendingPayout.id,
      approvedRequest.status,
    ].join(":"),
    payoutApprovalOrderingKey: [
      "payout_approval_ordering",
      approvedRequest.id,
      pendingPayout.id,
      10,
    ].join(":"),
    privilegedExecutionKey: [
      "privileged_execution",
      "approve_payout_request_and_create_payout",
      approvedRequest.id,
      approvedRequest.id,
      pendingPayout.id,
    ].join(":"),
    serviceRoleExecutionKey: [
      "service_role_financial_execution",
      "approve_payout_request_and_create_payout",
      approvedRequest.id,
      approvedRequest.id,
      pendingPayout.id,
    ].join(":"),
    orderingSource: "runtime_payout_approval",
    replayTimestampSource: "payout_requests.approved_at",
    eventMetadata: {
      sourceOperation: "approvePayoutRequestLifecycle",
      attachedEarningCount: attachedEarningIds.length,
    },
    lineageMetadata: {
      payoutRequestApprovedToPayoutObserved: true,
      earningAttachmentObserved: attachedEarningIds.length > 0,
    },
    provenanceMetadata: {
      payoutApprovalRuntimeAuthorityPreserved: true,
      payoutRuntimeAuthorityPreserved: true,
      advisoryOnly: true,
    },
  })

  await synchronizePrivilegedExecutionTraceabilityNoThrow({
    invocationSurface: "approve_payout_request_and_create_payout",
    definedSecurityDefinerSurface: "approve_payout_request_and_create_payout",
    definedSecurityDefinerPresent: true,
    observedSecurityDefinerInvoked: true,
    observedRuntimeSurface:
      "supabase.rpc.approve_payout_request_and_create_payout",
    serviceRoleSurface: "service_role.payout_rpc_execution",
    mutationSurface:
      "payout_requests.approval_runtime_mutation+payouts.insert+earnings.payout_attachment",
    sourceTable: "payout_requests",
    sourceRowId: approvedRequest.id,
    payoutRequestId: approvedRequest.id,
    payoutId: pendingPayout.id,
    creatorId: approvedRequest.creator_id,
    executionKind: "security_definer_payout_approval",
    executedAt: approvedRequest.approved_at,
    orderingSequence: 10,
    orderingTimestamp: approvedRequest.approved_at,
    orderingSource: "runtime_security_definer_payout_approval",
    replayTimestampSource: "payout_requests.approved_at",
    lineage: [
      {
        lineageKind: "security_definer_approval_to_payout",
        sourceTable: "payout_requests",
        sourceRowId: approvedRequest.id,
        targetTable: "payouts",
        targetRowId: pendingPayout.id,
        lineageMetadata: {
          securityDefinerInvocationObserved: true,
          payoutRequestServiceAuthoritative: true,
        },
      },
      ...attachedEarningIds.map((earningId) => ({
        lineageKind: "security_definer_approval_to_earning_attachment",
        sourceTable: "payout_requests",
        sourceRowId: approvedRequest.id,
        targetTable: "earnings",
        targetRowId: earningId,
        lineageMetadata: {
          payoutAttachmentRuntimeObserved: true,
        },
      })),
    ],
    invocationMetadata: {
      sourceOperation: "approvePayoutRequestLifecycle",
      rpcName: "approve_payout_request_and_create_payout",
    },
    provenanceMetadata: {
      payoutApprovalRuntimeAuthorityPreserved: true,
      securityDefinerExecutionAuthorityPreserved: true,
      payoutExecutionTransferAllowed: false,
    },
  })

  await synchronizeServiceRoleFinancialExecutionTraceabilityNoThrow({
    executionSurface: "approve_payout_request_and_create_payout",
    serviceRoleSurface: "service_role.payout_rpc_execution",
    runtimeSurface: "supabase.rpc.approve_payout_request_and_create_payout",
    mutationSurface:
      "payout_requests.approval_runtime_mutation+payouts.insert+earnings.payout_attachment",
    sourceTable: "payout_requests",
    sourceRowId: approvedRequest.id,
    payoutRequestId: approvedRequest.id,
    payoutId: pendingPayout.id,
    creatorId: approvedRequest.creator_id,
    executionKind: "service_role_financial_payout_approval",
    executedAt: approvedRequest.approved_at,
    orderingSequence: 10,
    orderingTimestamp: approvedRequest.approved_at,
    orderingSource: "runtime_service_role_payout_approval",
    replayTimestampSource: "payout_requests.approved_at",
    lineage: [
      {
        lineageKind: "service_role_approval_to_payout",
        sourceTable: "payout_requests",
        sourceRowId: approvedRequest.id,
        targetTable: "payouts",
        targetRowId: pendingPayout.id,
        lineageMetadata: {
          serviceRoleRuntimeAuthorityPreserved: true,
          securityDefinerInvocationObserved: true,
        },
      },
      ...attachedEarningIds.map((earningId) => ({
        lineageKind: "service_role_approval_to_earning_attachment",
        sourceTable: "payout_requests",
        sourceRowId: approvedRequest.id,
        targetTable: "earnings",
        targetRowId: earningId,
        lineageMetadata: {
          serviceRoleRuntimeAuthorityPreserved: true,
          payoutAttachmentRuntimeObserved: true,
        },
      })),
    ],
    executionMetadata: {
      sourceOperation: "approvePayoutRequestLifecycle",
      rpcName: "approve_payout_request_and_create_payout",
    },
    provenanceMetadata: {
      payoutApprovalRuntimeAuthorityPreserved: true,
      serviceRoleRuntimeAuthorityPreserved: true,
      governanceOwnedExecutionAuthorityAllowed: false,
      replayOwnedServiceRoleMutationAllowed: false,
    },
  })

  await verifyApprovedPayoutRequestPostcondition({
    payoutRequestId,
  })

  return {
    payoutRequestId: approvedRow.payout_request_id,
    payoutId: approvedRow.payout_id,
    creatorId: approvedRow.creator_id,
    amount: approvedRow.amount,
    currency: approvedRow.currency,
    status: approvedRow.status,
  }
}