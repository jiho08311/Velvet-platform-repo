import type { Earning, EarningSourceType, EarningStatus } from "../types"
import {
  listCreatorEarningRows,
  type CreatorEarningRow,
} from "@/modules/payout/repositories/earning-read-repository"

type ListCreatorEarningsInput = {
  creatorId: string
  status?: EarningStatus
}

function toEarning(row: CreatorEarningRow): Earning {
  return {
    id: row.id,
    creatorId: row.creator_id,
    paymentId: row.payment_id,
    payoutId: row.payout_id,
    sourceType: row.source_type,
    grossamount: row.gross_amount,
    feeRateBps: row.fee_rate_bps,
    feeamount: row.fee_amount,
    netamount: row.net_amount,
    currency: row.currency,
    status: row.status,
    availableAt: row.available_at,
    paidOutAt: row.paid_out_at,
    reversedAt: row.reversed_at,
    createdAt: row.created_at,
  }
}

export async function listCreatorEarnings({
  creatorId,
  status,
}: ListCreatorEarningsInput): Promise<Earning[]> {
  const id = creatorId.trim()

  if (!id) {
    return []
  }

  const rows = await listCreatorEarningRows({
    creatorId: id,
    status,
  })

  return rows.map(toEarning)
}