import { createLedgerHold } from "@/modules/ledger/services/ledger-hold-service"
import { createLedgerTransaction } from "@/modules/ledger/services/ledger-transaction-service"

type CreatePayoutRequestLedgerHoldInput = {
  creatorId: string
  payoutRequestId: string
  amount: number
  currency: string
  occurredAt: string
}

export async function createPayoutRequestLedgerHold({
  creatorId,
  payoutRequestId,
  amount,
  currency,
  occurredAt,
}: CreatePayoutRequestLedgerHoldInput) {
  const transaction = await createLedgerTransaction({
    transactionType: "hold_created",
    creatorId,
    payoutRequestId,
    amount,
    currency,
    occurredAt,
    entries: [
      {
        accountCode: "CREATOR_RECEIVABLE",
        entryType: "creator_receivable",
        direction: "debit",
        amount,
        currency,
        creatorId,
        payoutRequestId,
      },
      {
        accountCode: "CREATOR_PAYABLE",
        entryType: "creator_payable",
        direction: "credit",
        amount,
        currency,
        creatorId,
        payoutRequestId,
      },
    ],
  })

  const hold = await createLedgerHold({
    creatorId,
    sourceTransactionId: transaction.id,
    amount,
    currency,
    holdType: "manual_review",
  })

  return {
    transaction,
    hold,
  }
}