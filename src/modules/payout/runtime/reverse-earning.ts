import { executeEarningReversal } from "@/modules/payout/runtime/execute-earning-reversal"

type ReverseEarningInput = {
  paymentId: string
  reason?: string
}

export async function reverseEarning(input: ReverseEarningInput): Promise<void> {
  const result = await executeEarningReversal(input)

  if (result.status === "blocked_paid_out") {
    throw new Error("CANNOT_REVERSE_ALREADY_PAID_OUT")
  }

  if (result.status === "not_found") {
    throw new Error("EARNING_NOT_FOUND")
  }
}
