type EarningBalanceStatus =
  | "pending"
  | "available"
  | "requested"
  | "paid_out"
  | "reversed"

type EarningBalanceRow = {
  net_amount: number | null
  status: EarningBalanceStatus
  payout_id?: string | null
  payout_request_id?: string | null
}

export type PayoutBalanceTotals = {
  pendingAmount: number
  availableAmount: number
  requestedAmount: number
  paidOutAmount: number
  reversedAmount: number
  requestableAmount: number
}

function toSafeAmount(value: number | null | undefined): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, value ?? 0)
}

export function isRequestableEarning(row: EarningBalanceRow): boolean {
  return (
    row.status === "available" &&
    !row.payout_request_id &&
    !row.payout_id
  )
}

export function sumRequestableEarnings(rows: EarningBalanceRow[]): number {
  return rows.reduce((sum, row) => {
    if (!isRequestableEarning(row)) {
      return sum
    }

    return sum + toSafeAmount(row.net_amount)
  }, 0)
}

export function resolvePayoutBalanceTotals(
  rows: EarningBalanceRow[]
): PayoutBalanceTotals {
  let pendingAmount = 0
  let availableAmount = 0
  let requestedAmount = 0
  let paidOutAmount = 0
  let reversedAmount = 0

  for (const row of rows) {
    const amount = toSafeAmount(row.net_amount)

    if (row.status === "pending") {
      pendingAmount += amount
      continue
    }

    if (row.status === "available") {
      availableAmount += amount
      continue
    }

    if (row.status === "requested") {
      requestedAmount += amount
      continue
    }

    if (row.status === "paid_out") {
      paidOutAmount += amount
      continue
    }

    if (row.status === "reversed") {
      reversedAmount += amount
    }
  }

  return {
    pendingAmount,
    availableAmount,
    requestedAmount,
    paidOutAmount,
    reversedAmount,
    requestableAmount: sumRequestableEarnings(rows),
  }
}

export function resolveFullAvailablePayoutAmount(
  rows: EarningBalanceRow[]
): number {
  return sumRequestableEarnings(rows)
}