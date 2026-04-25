export type CreatePayoutRequestInput = {
  creatorId: string
  amount?: number
  currency?: string
}

export type NormalizedCreatePayoutRequestInput = {
  creatorId: string
  requestedAmount: number | null
  currency: string
}

export type CreatePayoutRequestResult = {
  id: string
  creatorId: string
  amount: number
  currency: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

type CreatePayoutRequestRow = {
  id: string
  creator_id: string
  amount: number
  currency: string
  status: "pending" | "approved" | "rejected"
  created_at: string
}

function normalizeRequestedAmount(amount: number | undefined): number | null {
  if (amount === undefined) {
    return null
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("PAYOUT_REQUEST_AMOUNT_INVALID")
  }

  return amount
}

export function normalizeCreatePayoutRequestInput(
  input: CreatePayoutRequestInput
): NormalizedCreatePayoutRequestInput {
  const creatorId = input.creatorId.trim()

  if (!creatorId) {
    throw new Error("PAYOUT_REQUEST_CREATOR_ID_REQUIRED")
  }

  return {
    creatorId,
    requestedAmount: normalizeRequestedAmount(input.amount),
    currency: input.currency?.trim().toUpperCase() || "KRW",
  }
}

export function mapCreatePayoutRequestResult(
  row: CreatePayoutRequestRow
): CreatePayoutRequestResult {
  return {
    id: row.id,
    creatorId: row.creator_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    createdAt: row.created_at,
  }
}
