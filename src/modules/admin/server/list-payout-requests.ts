import { createClient } from "@/infrastructure/supabase/server"
import {
  resolvePayoutExecutionLifecycleState,
  type PayoutExecutionLifecycleState,
} from "@/modules/payout/lib/resolve-payout-state"
import {
  resolveAdminPayoutRequestRow,
  type AdminPayoutAction,
} from "@/modules/admin/lib/payout-request-admin-policy"

type PayoutRequestLifecycleState =
  | "pending_request"
  | "approved"
  | "rejected"
  | "inactive"

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
  creator_id: string
  creator_username: string | null
  creator_display_name: string | null
  creator_label: string
  amount: number
  currency: string
  status: string
  created_at: string
  approved_at: string | null
  rejected_at: string | null
  rejection_reason: string | null
  payout_id: string | null
  payout_status: "pending" | "processing" | "paid" | "failed" | null
  payout_paid_at: string | null
  payout_failure_reason: string | null
  request_lifecycle_state: PayoutRequestLifecycleState
  payout_execution_state: PayoutExecutionLifecycleState | null
  status_badges: AdminPayoutStatusBadge[]
  available_action_order: AdminPayoutAction[]
  failure_message: string | null
}

type PayoutRow = {
  id: string
  payout_request_id: string | null
  status: "pending" | "processing" | "paid" | "failed"
  paid_at: string | null
  failure_reason: string | null
}

type CreatorRow = {
  id: string
  username: string | null
  display_name: string | null
}

type PayoutRequestRow = {
  id: string
  creator_id: string
  amount: number | null
  currency: string | null
  status: string
  created_at: string
  approved_at: string | null
  rejected_at: string | null
  rejection_reason: string | null
}

function resolveRequestLifecycleState(input: {
  payoutRequestStatus?: string | null
}): PayoutRequestLifecycleState {
  const payoutRequestStatus = input.payoutRequestStatus ?? null

  if (payoutRequestStatus === "rejected") {
    return "rejected"
  }

  if (payoutRequestStatus === "approved") {
    return "approved"
  }

  if (payoutRequestStatus === "pending") {
    return "pending_request"
  }

  return "inactive"
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
  payout: PayoutRow | null
  creator: CreatorRow | null
}): AdminPayoutRequestListItem {
  const { requestRow, payout, creator } = input

  const requestLifecycleState = resolveRequestLifecycleState({
    payoutRequestStatus: requestRow.status,
  })

  const payoutExecutionState = payout
    ? resolvePayoutExecutionLifecycleState({
        payoutStatus: payout.status,
      })
    : null

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
    id: requestRow.id,
    creator_id: requestRow.creator_id,
    creator_username: creatorUsername,
    creator_display_name: creatorDisplayName,
    creator_label: creatorLabel,
    amount: Number(requestRow.amount ?? 0),
    currency: requestRow.currency ?? "KRW",
    status: requestRow.status,
    created_at: requestRow.created_at,
    approved_at: requestRow.approved_at ?? null,
    rejected_at: requestRow.rejected_at ?? null,
    rejection_reason: rejectionReason,
    payout_id: payout?.id ?? null,
    payout_status: payout?.status ?? null,
    payout_paid_at: payout?.paid_at ?? null,
    payout_failure_reason: payoutFailureReason,
    request_lifecycle_state: requestLifecycleState,
    payout_execution_state: payoutExecutionState,
    status_badges: adminRowPolicy.badges,
    available_action_order: adminRowPolicy.actions,
    failure_message: failureMessage,
  }
}

export async function listPayoutRequests(): Promise<
  AdminPayoutRequestListItem[]
> {
  const supabase = await createClient()

  const { data, error } = await supabase
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

  let payoutRows: PayoutRow[] = []

  if (requestIds.length > 0) {
    const { data: payoutsData, error: payoutsError } = await supabase
      .from("payouts")
      .select("id, payout_request_id, status, paid_at, failure_reason")
      .in("payout_request_id", requestIds)
      .returns<PayoutRow[]>()

    if (payoutsError) {
      throw new Error(payoutsError.message)
    }

    payoutRows = payoutsData ?? []
  }

  let creatorRows: CreatorRow[] = []

  if (creatorIds.length > 0) {
    const { data: creatorsData, error: creatorsError } = await supabase
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
    const aPending = a.request_lifecycle_state === "pending_request" ? 0 : 1
    const bPending = b.request_lifecycle_state === "pending_request" ? 0 : 1

    if (aPending !== bPending) {
      return aPending - bPending
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}