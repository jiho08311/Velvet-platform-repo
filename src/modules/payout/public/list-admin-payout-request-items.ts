import {
  resolveAdminPayoutRequestRow,
  type AdminPayoutAction,
} from "@/modules/admin/public/payout-request-admin-policy"
import {
  buildPayoutExecutionReadModel,
  type PayoutExecutionReadModel,
} from "@/modules/payout/public/build-payout-execution-read-model"
import {
  buildPayoutRequestReadModel,
  type PayoutRequestReadModel,
} from "@/modules/payout/public/build-payout-request-read-model"
import type {
  PayoutExecutionLifecycleState,
  PayoutRequestLifecycleState,
} from "@/modules/payout/public/resolve-payout-state"
import {
  listPayoutRowsByRequestIds,
  type PayoutRowByRequestId,
} from "@/modules/payout/repositories/payout-read-repository"
import {
  listAdminPayoutRequestRows,
  type AdminPayoutRequestRow,
} from "@/modules/payout/repositories/payout-request-read-repository"
import { listCreatorIdentitiesByCreatorIds } from "@/modules/identity/public/creator-identity-read-model"

export const PUBLIC_CONTRACT = true

export type AdminPayoutBadgeTone =
  | "pending"
  | "approved"
  | "rejected"
  | "processing"
  | "paid"
  | "failed"

export type AdminPayoutStatusBadge = {
  key: "request" | "payout"
  label: string
  tone: AdminPayoutBadgeTone
}

export type AdminPayoutRequestListItem = {
  id: string
  creatorId: string
  creatorUsername: string | null
  creatorDisplayName: string | null
  creatorLabel: string
  amount: number
  currency: string
  createdAt: string
  approvedAt: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  payoutId: string | null
  payoutPaidAt: string | null
  payoutFailureReason: string | null
  requestLifecycleState: PayoutRequestLifecycleState
  payoutExecutionState: PayoutExecutionLifecycleState | null
  statusBadges: AdminPayoutStatusBadge[]
  availableActionOrder: AdminPayoutAction[]
  failureMessage: string | null
}

type AdminLinkedPayoutRow = PayoutRowByRequestId & {
  readModel: PayoutExecutionReadModel
}

type CreatorRow = {
  id: string
  username: string | null
  display_name: string | null
}

function normalizeText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

function resolveCreatorLabel(input: {
  creatorId: string
  creatorUsername: string | null
  creatorDisplayName: string | null
}): string {
  if (input.creatorDisplayName && input.creatorUsername) {
    return `${input.creatorDisplayName} (@${input.creatorUsername})`
  }

  if (input.creatorDisplayName) {
    return input.creatorDisplayName
  }

  if (input.creatorUsername) {
    return `@${input.creatorUsername}`
  }

  return input.creatorId
}

function resolveRequestFailureMessage(input: {
  requestLifecycleState: PayoutRequestLifecycleState
  rejectionReason: string | null
}): string | null {
  if (input.requestLifecycleState !== "rejected") {
    return null
  }

  return input.rejectionReason ?? "Payout request rejected"
}

function resolveExecutionFailureMessage(input: {
  requestLifecycleState: PayoutRequestLifecycleState
  payoutExecutionState: PayoutExecutionLifecycleState | null
  payoutFailureReason: string | null
}): string | null {
  if (input.requestLifecycleState !== "approved") {
    return null
  }

  if (input.payoutExecutionState !== "failed") {
    return null
  }

  return input.payoutFailureReason ?? "Payout failed"
}

function resolveFailureMessage(input: {
  requestLifecycleState: PayoutRequestLifecycleState
  payoutExecutionState: PayoutExecutionLifecycleState | null
  rejectionReason: string | null
  payoutFailureReason: string | null
}): string | null {
  const requestFailureMessage = resolveRequestFailureMessage({
    requestLifecycleState: input.requestLifecycleState,
    rejectionReason: input.rejectionReason,
  })

  if (requestFailureMessage) {
    return requestFailureMessage
  }

  return resolveExecutionFailureMessage({
    requestLifecycleState: input.requestLifecycleState,
    payoutExecutionState: input.payoutExecutionState,
    payoutFailureReason: input.payoutFailureReason,
  })
}

function toAdminPayoutRequestListItem(input: {
  requestRow: AdminPayoutRequestRow
  payout: AdminLinkedPayoutRow | null
  creator: CreatorRow | null
}): AdminPayoutRequestListItem {
  const { requestRow, payout, creator } = input

  const requestReadModel: PayoutRequestReadModel =
    buildPayoutRequestReadModel(requestRow)
  const requestLifecycleState = requestReadModel.lifecycleState
  const payoutExecutionState = payout?.readModel.lifecycleState ?? null

  const creatorUsername = normalizeText(creator?.username)
  const creatorDisplayName = normalizeText(creator?.display_name)
  const creatorLabel = resolveCreatorLabel({
    creatorId: requestRow.creator_id,
    creatorUsername,
    creatorDisplayName,
  })

  const rejectionReason = normalizeText(requestRow.rejection_reason)
  const payoutFailureReason = normalizeText(payout?.failure_reason)

  const adminRowPolicy = resolveAdminPayoutRequestRow({
    requestLifecycleState,
    payoutExecutionState,
    hasPayout: Boolean(payout),
  })

  const failureMessage = resolveFailureMessage({
    requestLifecycleState,
    payoutExecutionState,
    rejectionReason,
    payoutFailureReason,
  })

  return {
    id: requestReadModel.id,
    creatorId: requestReadModel.creatorId,
    creatorUsername,
    creatorDisplayName,
    creatorLabel,
    amount: requestReadModel.amount,
    currency: requestReadModel.currency,
    createdAt: requestReadModel.createdAt,
    approvedAt: requestReadModel.approvedAt,
    rejectedAt: requestReadModel.rejectedAt,
    rejectionReason,
    payoutId: payout?.id ?? null,
    payoutPaidAt: payout?.readModel.paidAt ?? null,
    payoutFailureReason,
    requestLifecycleState,
    payoutExecutionState,
    statusBadges: adminRowPolicy.badges,
    availableActionOrder: adminRowPolicy.actions,
    failureMessage,
  }
}

export async function listAdminPayoutRequestItems(): Promise<
  AdminPayoutRequestListItem[]
> {
  const requestRows = await listAdminPayoutRequestRows()
  const requestIds = requestRows.map((row) => row.id)
  const creatorIds = [...new Set(requestRows.map((row) => row.creator_id))]

  const [payoutRows, creatorRows] = await Promise.all([
    listPayoutRowsByRequestIds(requestIds),
    listCreatorIdentitiesByCreatorIds(creatorIds),
  ])

  const linkedPayoutRows: AdminLinkedPayoutRow[] = payoutRows.map((payout) => ({
    ...payout,
    readModel: buildPayoutExecutionReadModel(payout),
  }))

  const payoutMap = new Map(
    linkedPayoutRows.map((payout) => [payout.payout_request_id, payout]),
  )

  const creatorMap = new Map(
    creatorRows.map((creator) => [
      creator.id,
      {
        id: creator.id,
        username: creator.username,
        display_name: creator.displayName,
      },
    ]),
  )

  const items = requestRows.map((requestRow) =>
    toAdminPayoutRequestListItem({
      requestRow,
      payout: payoutMap.get(requestRow.id) ?? null,
      creator: creatorMap.get(requestRow.creator_id) ?? null,
    }),
  )

  return items.sort((a, b) => {
    const aPending = a.requestLifecycleState === "pending_request" ? 0 : 1
    const bPending = b.requestLifecycleState === "pending_request" ? 0 : 1

    if (aPending !== bPending) {
      return aPending - bPending
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}
