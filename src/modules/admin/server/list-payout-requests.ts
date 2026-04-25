import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { PayoutExecutionLifecycleState } from "@/modules/payout/lib/resolve-payout-state"
import {
  resolveAdminPayoutRequestRow,
  type AdminPayoutAction,
} from "@/modules/admin/lib/payout-request-admin-policy"
import {
  buildPayoutRequestReadModel,
  type PayoutRequestReadModel,
} from "@/modules/payout/server/build-payout-request-read-model"
import {
  buildPayoutExecutionReadModel,
  type PayoutExecutionReadModel,
  type PayoutExecutionRow,
} from "@/modules/payout/server/build-payout-execution-read-model"
import type { PayoutRequestLifecycleState } from "@/modules/payout/lib/resolve-payout-state"
import { requireAdmin } from "@/modules/admin/server/require-admin"
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

type PayoutRow = PayoutExecutionRow & {
  payout_request_id: string | null
}

type AdminLinkedPayoutRow = PayoutRow & {
  readModel: PayoutExecutionReadModel
}

type CreatorRow = {
  id: string
  username: string | null
  display_name: string | null
}

type PayoutRequestRow = Parameters<typeof buildPayoutRequestReadModel>[0] & {
  rejection_reason: string | null
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
  requestRow: PayoutRequestRow
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

export async function listPayoutRequests(): Promise<
  AdminPayoutRequestListItem[]
> {
    await requireAdmin()
  const { data, error } = await supabaseAdmin
    .from("payout_requests")
    .select(`
      id,
      creator_id,
      amount,
      currency,
      status,
      created_at,
      approved_at,
      rejected_at,
      rejection_reason
    `)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const requestRows = (data ?? []) as PayoutRequestRow[]
  const requestIds = requestRows.map((row) => row.id)
  const creatorIds = [...new Set(requestRows.map((row) => row.creator_id))]

  let payoutRows: AdminLinkedPayoutRow[] = []

  if (requestIds.length > 0) {
    const { data: payoutsData, error: payoutsError } = await supabaseAdmin
      .from("payouts")
      .select("id, payout_request_id, status, paid_at, failure_reason")
      .in("payout_request_id", requestIds)
      .returns<PayoutRow[]>()

    if (payoutsError) {
      throw new Error(payoutsError.message)
    }

    payoutRows = (payoutsData ?? []).map((payout) => ({
      ...payout,
      readModel: buildPayoutExecutionReadModel(payout),
    }))
  }

  let creatorRows: CreatorRow[] = []

  if (creatorIds.length > 0) {
    const { data: creatorsData, error: creatorsError } = await supabaseAdmin
      .from("creators")
      .select("id, username, display_name")
      .in("id", creatorIds)
      .returns<CreatorRow[]>()

    if (creatorsError) {
      throw new Error(creatorsError.message)
    }

    creatorRows = creatorsData ?? []
  }

  const payoutMap = new Map(
    payoutRows.map((payout) => [payout.payout_request_id, payout])
  )

  const creatorMap = new Map(
    creatorRows.map((creator) => [creator.id, creator])
  )

  const items = requestRows.map((requestRow) =>
    toAdminPayoutRequestListItem({
      requestRow,
      payout: payoutMap.get(requestRow.id) ?? null,
      creator: creatorMap.get(requestRow.creator_id) ?? null,
    })
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
