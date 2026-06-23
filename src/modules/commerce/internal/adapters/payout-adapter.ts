import { approvePayoutRequest } from "@/modules/payout/public/approve-payout-request"
import { createPayoutRequest } from "@/modules/payout/public/create-payout-request"
import { getPayoutIdByRequestId } from "@/modules/payout/public/get-payout-id-by-request-id"
import { getPayoutRequest } from "@/modules/payout/public/get-payout-request"
import { listAllPayoutRequests } from "@/modules/payout/public/list-all-payout-requests"
import { markPayoutAsFailed } from "@/modules/payout/public/mark-payout-as-failed"
import { rejectPayoutRequest } from "@/modules/payout/public/reject-payout-request"
import { sendPayout } from "@/modules/payout/public/send-payout"
import { getPayoutById } from "@/modules/payout/public/get-payout-by-id"
import { getCreatorPayoutHistory } from "@/modules/payout/public/get-creator-payout-history"
import { getPayoutSummary } from "@/modules/payout/public/get-payout-summary"
import { listCreatorPayouts } from "@/modules/payout/public/list-creator-payouts"
import { listPayoutRequests } from "@/modules/payout/public/list-payout-requests"
import {
  listAdminPayoutRequestItems,
} from "@/modules/payout/public/list-admin-payout-request-items"
export async function getCanonicalPayoutSummary(creatorId: string) {
  return getPayoutSummary(creatorId)
}

export async function listCanonicalCreatorPayouts(input: {
  creatorId: string
}) {
  return listCreatorPayouts(input)
}

export async function createCanonicalPayoutRequest(input: {
  creatorId: string
  amount?: number
  currency?: string
}) {
  return createPayoutRequest({
    creatorId: input.creatorId,
    amount: input.amount,
    currency: input.currency,
  })
}

export async function approveCanonicalPayoutRequest(input: {
  payoutRequestId: string
}) {
  return approvePayoutRequest(input)
}

export async function rejectCanonicalPayoutRequest(input: {
  payoutRequestId: string
}) {
  return rejectPayoutRequest(input)
}

export async function executeCanonicalPayout(input: {
  payoutId: string
}) {
  return sendPayout({
    payoutId: input.payoutId,
  })
}

export async function failCanonicalPayout(input: {
  payoutId: string
  failureReason?: string
}) {
  return markPayoutAsFailed({
    payoutId: input.payoutId,
    failureReason: input.failureReason,
  })
}

export async function getCanonicalPayoutById(payoutId: string) {
  return getPayoutById(payoutId)
}

export async function getCanonicalPayoutRequest(input: {
  payoutRequestId: string
}) {
  return getPayoutRequest({
    payoutRequestId: input.payoutRequestId,
  })
}

export async function getCanonicalPayoutIdByRequestId(
  payoutRequestId: string
) {
  return getPayoutIdByRequestId(payoutRequestId)
}

export async function listCanonicalPayoutRequests(input: {
  creatorId: string
}) {
  return listPayoutRequests(input)
}

export async function listCanonicalAllPayoutRequests() {
  return listAllPayoutRequests()
}

export async function getCanonicalCreatorPayoutHistory() {
  return getCreatorPayoutHistory()
}

export async function listCanonicalAdminPayoutRequestItems() {
  return listAdminPayoutRequestItems()
}