import {
  findPayoutTerminalRowOrThrow,
} from "@/modules/payout/repositories/payout-read-repository"

export const PUBLIC_CONTRACT = true

export type PayoutReadContract = {
  id: string
  creator_id: string
  payout_request_id: string | null
  amount: number
  currency: string
  status: "pending" | "processing" | "paid" | "failed"
  paid_at: string | null
  failure_reason: string | null
}

export async function getPayoutById(
  payoutId: string,
): Promise<PayoutReadContract> {
  const row = await findPayoutTerminalRowOrThrow(payoutId)

  return {
    id: row.id,
    creator_id: row.creator_id,
    payout_request_id: row.payout_request_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    paid_at: row.paid_at,
    failure_reason: row.failure_reason,
  }
}
