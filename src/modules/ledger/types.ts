export type LedgerTransactionType =
  | "payment_confirmed"
  | "payout_requested"
  | "payout_paid"
  | "refund"
  | "chargeback"
  | "adjustment"
  | "hold_created"
  | "hold_released"

export type LedgerEntryDirection = "debit" | "credit"

export type LedgerEntryType =
  | "gross_payment"
  | "platform_fee"
  | "creator_receivable"
  | "creator_payable"
  | "tax_hold"
  | "processor_fee"
  | "cash_movement"
  | "refund_reversal"
  | "chargeback_reversal"
  | "adjustment"

export type LedgerEntryInput = {
  accountCode: string
  entryType: LedgerEntryType
  direction: LedgerEntryDirection
  amount: number
  currency: string
  creatorId?: string | null
  paymentId?: string | null
  payoutId?: string | null
  payoutRequestId?: string | null
}

export type CreateLedgerTransactionInput = {
  transactionType: LedgerTransactionType
  paymentId?: string | null
  payoutId?: string | null
  payoutRequestId?: string | null
  creatorId?: string | null
  amount: number
  currency: string
  referenceTransactionId?: string | null
  occurredAt: string
  entries: LedgerEntryInput[]
}

export type LedgerTransactionRow = {
  id: string
  transaction_type: LedgerTransactionType
  payment_id: string | null
  payout_id: string | null
  payout_request_id: string | null
  creator_id: string | null
  amount: number
  currency: string
  reference_transaction_id: string | null
  occurred_at: string
  created_at: string
}

export type LedgerHoldType =
  | "tax"
  | "processor_fee"
  | "refund_reserve"
  | "chargeback_reserve"
  | "manual_review"

export type LedgerHoldStatus =
  | "active"
  | "released"
  | "consumed"
  | "cancelled"

export type LedgerHoldRow = {
  id: string
  creator_id: string
  source_transaction_id: string
  amount: number
  currency: string
  hold_type: LedgerHoldType
  status: LedgerHoldStatus
  expires_at: string | null
  released_at: string | null
  created_at: string
}

export type CreateLedgerHoldInput = {
  creatorId: string
  sourceTransactionId: string
  amount: number
  currency: string
  holdType: LedgerHoldType
}