import { approvePayoutRequestUseCase } from "@/modules/commerce/application/payout/approve-payout-request-use-case"
import { createPayoutRequestUseCase } from "@/modules/commerce/application/payout/create-payout-request-use-case"
import { getPayoutExecutionUseCase } from "@/modules/commerce/application/payout/get-payout-execution-use-case"
import { getPayoutRequestUseCase } from "@/modules/commerce/application/payout/get-payout-request-use-case"
import { rejectPayoutRequestUseCase } from "@/modules/commerce/application/payout/reject-payout-request-use-case"
import { sendPayoutUseCase } from "@/modules/commerce/application/payout/send-payout-use-case"
import {
  failCanonicalPayout,
  getCanonicalCreatorPayoutHistory,
  getCanonicalPayoutIdByRequestId,
  getCanonicalPayoutSummary,
  listCanonicalAdminPayoutRequestItems,
  listCanonicalAllPayoutRequests,
  listCanonicalCreatorPayouts,
  listCanonicalPayoutRequests,
} from "@/modules/commerce/internal/adapters/payout-adapter"

import type {
  CommerceContext,
  PayoutExecutionState,
  PayoutRequestState,
} from "./types"

export type {
  AdminPayoutBadgeTone,
  AdminPayoutRequestListItem,
  AdminPayoutStatusBadge,
} from "@/modules/payout/public/list-admin-payout-request-items"

export async function createPayoutRequest(
  input: CreatePayoutRequestInput
): Promise<CreatePayoutRequestResult> {
  return createPayoutRequestUseCase(input)
}

export async function approvePayoutRequest(
  input: ApprovePayoutRequestInput
): Promise<ApprovePayoutRequestResult> {
  return approvePayoutRequestUseCase(input)
}

export async function rejectPayoutRequest(
  input: RejectPayoutRequestInput
): Promise<RejectPayoutRequestResult> {
  return rejectPayoutRequestUseCase(input)
}

export async function sendPayout(
  input: SendPayoutInput
): Promise<SendPayoutResult> {
  return sendPayoutUseCase(input)
}

export async function failPayout(
  input: FailPayoutInput
): Promise<FailPayoutResult> {
  await failCanonicalPayout({
    payoutId: input.payoutId,
    failureReason: input.reason,
  })

  const result = await getPayoutExecutionUseCase({
    payoutId: input.payoutId,
  })

  if (!result.payout) {
    throw new Error("Payout not found after fail transition")
  }

  return {
    payout: result.payout,
  }
}

export async function getPayoutRequest(
  input: GetPayoutRequestInput
): Promise<GetPayoutRequestResult> {
  return getPayoutRequestUseCase(input)
}

export async function getPayoutExecution(
  input: GetPayoutExecutionInput
): Promise<GetPayoutExecutionResult> {
  return getPayoutExecutionUseCase(input)
}

export async function getCreatorPayoutSummary(creatorId: string) {
  return getCanonicalPayoutSummary(creatorId)
}

export async function listCreatorPayoutExecutions(input: {
  creatorId: string
}) {
  return listCanonicalCreatorPayouts(input)
}

export async function listCreatorPayoutRequests(input: {
  creatorId: string
}) {
  return listCanonicalPayoutRequests(input)
}

export async function listAdminPayoutRequests() {
  return listCanonicalAllPayoutRequests()
}

export async function listAdminPayoutRequestItems() {
  return listCanonicalAdminPayoutRequestItems()
}

export { getCanonicalPayoutIdByRequestId }

export async function getCreatorPayoutHistory() {
  return getCanonicalCreatorPayoutHistory()
}

export type CreatePayoutRequestInput = {
  creatorId: string
  amount?: number
  currency?: string
  context?: CommerceContext
}

export type CreatePayoutRequestResult = {
  payoutRequest: PayoutRequestState
}

export type ApprovePayoutRequestInput = {
  payoutRequestId: string
  context?: CommerceContext
}

export type ApprovePayoutRequestResult = {
  payoutRequestId: string
  payoutId: string
}

export type RejectPayoutRequestInput = {
  payoutRequestId: string
  reason?: string
  context?: CommerceContext
}

export type RejectPayoutRequestResult = {
  payoutRequestId: string
}

export type SendPayoutInput = {
  payoutId: string
  context?: CommerceContext
}

export type SendPayoutResult = {
  payout: PayoutExecutionState
}

export type FailPayoutInput = {
  payoutId: string
  reason?: string
  context?: CommerceContext
}

export type FailPayoutResult = {
  payout: PayoutExecutionState
}

export type GetPayoutRequestInput = {
  payoutRequestId: string
}

export type GetPayoutRequestResult = {
  payoutRequest: PayoutRequestState | null
}

export type ListPayoutRequestsInput = {
  creatorId: string
  cursor?: string
  limit?: number
}

export type ListPayoutRequestsResult = {
  payoutRequests: PayoutRequestState[]
  nextCursor: string | null
}

export type GetPayoutExecutionInput = {
  payoutId: string
}

export type GetPayoutExecutionResult = {
  payout: PayoutExecutionState | null
}