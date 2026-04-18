import {
  isPayoutExecutionTerminal,
  type PayoutExecutionLifecycleState,
  type PayoutRequestLifecycleState,
} from "@/modules/payout/lib/resolve-payout-state"
import { resolvePayoutExecutionPolicy } from "@/modules/payout/lib/payout-execution-policy"
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
  const actions = resolveActions({
    requestLifecycleState,
    payoutExecutionState,
    hasPayout,
  })

  const badges = resolveBadges({
    requestLifecycleState,
    payoutExecutionState,
  })

  return {
    actions,
    badges,
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

 const policy = resolvePayoutExecutionPolicy({
  status: payoutExecutionState,
})

const actions: AdminPayoutAction[] = []

if (policy.canSend) {
  actions.push("mark_as_paid")
}

if (policy.canMarkAsFailed) {
  actions.push("mark_as_failed")
}

return actions

  return []
}

function resolveBadges({
  requestLifecycleState,
  payoutExecutionState,
}: {
  requestLifecycleState: PayoutRequestLifecycleState
  payoutExecutionState?: PayoutExecutionLifecycleState | null
}): AdminPayoutStatusBadge[] {
  const badges: AdminPayoutStatusBadge[] = []

  if (requestLifecycleState === "pending_request") {
    badges.push({
      key: "request",
      label: "request: Pending",
      tone: "pending",
    })
  } else if (requestLifecycleState === "approved") {
    badges.push({
      key: "request",
      label: "request: Approved",
      tone: "approved",
    })
  } else if (requestLifecycleState === "rejected") {
    badges.push({
      key: "request",
      label: "request: Rejected",
      tone: "rejected",
    })
  } else {
    badges.push({
      key: "request",
      label: "request: Inactive",
      tone: "pending",
    })
  }

  if (requestLifecycleState === "approved") {
    if (payoutExecutionState === "paid") {
      badges.push({
        key: "payout",
        label: "payout: Paid",
        tone: "paid",
      })
    } else if (payoutExecutionState === "failed") {
      badges.push({
        key: "payout",
        label: "payout: Failed",
        tone: "failed",
      })
    } else if (payoutExecutionState === "processing") {
      badges.push({
        key: "payout",
        label: "payout: Processing",
        tone: "processing",
      })
    }
  }

  return badges
}