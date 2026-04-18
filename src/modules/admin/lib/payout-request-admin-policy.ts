import {
  isPayoutExecutionTerminal,
  type PayoutExecutionLifecycleState,
  type PayoutRequestLifecycleState,
} from "@/modules/payout/lib/resolve-payout-state"
import { resolvePayoutExecutionPolicy } from "@/modules/payout/lib/payout-execution-policy"
import { getPayoutExecutionLabel } from "@/modules/payout/lib/get-payout-execution-label"

export type AdminPayoutAction =
  | "approve"
  | "reject"
  | "mark_as_paid"
  | "mark_as_failed"

type ResolveAdminRowInput = {
  requestLifecycleState: PayoutRequestLifecycleState
  payoutExecutionState?: PayoutExecutionLifecycleState | null
  hasPayout: boolean
}

type AdminPayoutBadgeTone =
  | "pending"
  | "approved"
  | "rejected"
  | "processing"
  | "paid"
  | "failed"

type AdminPayoutStatusBadge = {
  key: "request" | "payout"
  label: string
  tone: AdminPayoutBadgeTone
}

export function resolveAdminPayoutRequestRow({
  requestLifecycleState,
  payoutExecutionState,
  hasPayout,
}: ResolveAdminRowInput) {
  return {
    actions: resolveActions({
      requestLifecycleState,
      payoutExecutionState,
      hasPayout,
    }),
    badges: resolveBadges({
      requestLifecycleState,
      payoutExecutionState,
    }),
  }
}

function resolveActions({
  requestLifecycleState,
  payoutExecutionState,
  hasPayout,
}: ResolveAdminRowInput): AdminPayoutAction[] {
  if (requestLifecycleState === "pending_request") {
    return ["approve", "reject"]
  }

  if (requestLifecycleState === "rejected") {
    return []
  }

  if (requestLifecycleState !== "approved") {
    return []
  }

  if (!hasPayout || !payoutExecutionState) {
    return []
  }

  if (isPayoutExecutionTerminal(payoutExecutionState)) {
    return []
  }

  const executionPolicy = resolvePayoutExecutionPolicy({
    status: payoutExecutionState,
  })

  const actions: AdminPayoutAction[] = []

  if (executionPolicy.canSend) {
    actions.push("mark_as_paid")
  }

  if (executionPolicy.canMarkAsFailed) {
    actions.push("mark_as_failed")
  }

  return actions
}

function resolveBadges({
  requestLifecycleState,
  payoutExecutionState,
}: {
  requestLifecycleState: PayoutRequestLifecycleState
  payoutExecutionState?: PayoutExecutionLifecycleState | null
}): AdminPayoutStatusBadge[] {
  const badges: AdminPayoutStatusBadge[] = [
    resolveRequestBadge(requestLifecycleState),
  ]

  if (requestLifecycleState !== "approved" || !payoutExecutionState) {
    return badges
  }

  const payoutBadge = resolvePayoutBadge(payoutExecutionState)

  if (payoutBadge) {
    badges.push(payoutBadge)
  }

  return badges
}

function resolveRequestBadge(
  requestLifecycleState: PayoutRequestLifecycleState
): AdminPayoutStatusBadge {
  if (requestLifecycleState === "pending_request") {
    return {
      key: "request",
      label: "request: Pending",
      tone: "pending",
    }
  }

  if (requestLifecycleState === "approved") {
    return {
      key: "request",
      label: "request: Approved",
      tone: "approved",
    }
  }

  if (requestLifecycleState === "rejected") {
    return {
      key: "request",
      label: "request: Rejected",
      tone: "rejected",
    }
  }

  return {
    key: "request",
    label: "request: Inactive",
    tone: "pending",
  }
}

function resolvePayoutBadge(
  payoutExecutionState: PayoutExecutionLifecycleState
): AdminPayoutStatusBadge | null {
  if (payoutExecutionState === "paid") {
    return {
      key: "payout",
      label: getPayoutExecutionLabel(payoutExecutionState),
      tone: "paid",
    }
  }

  if (payoutExecutionState === "failed") {
    return {
      key: "payout",
      label: getPayoutExecutionLabel(payoutExecutionState),
      tone: "failed",
    }
  }

  if (payoutExecutionState === "processing") {
    return {
      key: "payout",
      label: getPayoutExecutionLabel(payoutExecutionState),
      tone: "processing",
    }
  }

  return null
}