import type { Earning } from "@/modules/payout/types"

export type EarningCreationResult = {
  status: "created" | "already_exists" | "not_eligible"
  paymentId: string
  earning: Earning | null
}

export type EarningReversalResult = {
  status: "reversed" | "already_reversed" | "not_found" | "blocked_paid_out"
  paymentId: string
  earningId: string | null
}
