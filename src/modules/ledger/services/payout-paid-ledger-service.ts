import { createLedgerTransaction } from "@/modules/ledger/services/ledger-transaction-service"

type CreatePayoutPaidLedgerTransactionInput = {
  payoutId: string
  payoutRequestId: string | null
  creatorId: string
  amount: number
  currency: string
  paidAt: string
}

export async function createPayoutPaidLedgerTransaction({
  payoutId,
  payoutRequestId,
  creatorId,
  amount,
  currency,
  paidAt,
}: CreatePayoutPaidLedgerTransactionInput) {
  return createLedgerTransaction({
    transactionType: "payout_paid",
    payoutId,
    payoutRequestId,
    creatorId,
    amount,
    currency,
    occurredAt: paidAt,
    entries: [
      {
        accountCode: "CREATOR_PAYABLE",
        entryType: "creator_payable",
        direction: "debit",
        amount,
        currency,
        creatorId,
        payoutId,
        payoutRequestId,
      },
      {
        accountCode: "CASH",
        entryType: "cash_movement",
        direction: "credit",
        amount,
        currency,
        creatorId,
        payoutId,
        payoutRequestId,
      },
    ],
  })
}