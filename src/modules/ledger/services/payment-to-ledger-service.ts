import { createLedgerTransaction } from "@/modules/ledger/services/ledger-transaction-service"
import type { LedgerEntryInput } from "@/modules/ledger/types"
import type { PaymentType } from "@/modules/payment/types"

type PaymentToLedgerInput = {
  paymentId: string
  creatorId: string | null
  type: PaymentType
  amount: number
  currency: string | null
  confirmedAt: string
}

function getPlatformFeeRateBps(type: PaymentType): number {
  if (type === "subscription") return 2000
  if (type === "ppv_post") return 1000
  if (type === "ppv_message") return 1000
  if (type === "tip") return 1000

  return 0
}

export async function createPaymentConfirmedLedgerTransaction(
  payment: PaymentToLedgerInput
) {
  if (!payment.creatorId) {
    return null
  }

  if (!Number.isInteger(payment.amount) || payment.amount <= 0) {
    throw new Error("INVALID_PAYMENT_AMOUNT_FOR_LEDGER")
  }

  const currency = payment.currency ?? "KRW"

  const platformFee = Math.floor(
    (payment.amount * getPlatformFeeRateBps(payment.type)) / 10000
  )

  const taxHold = 0
  const processorFee = 0

  const creatorReceivable =
    payment.amount - platformFee - taxHold - processorFee

  if (creatorReceivable < 0) {
    throw new Error("CREATOR_RECEIVABLE_NEGATIVE")
  }

  const candidateEntries: LedgerEntryInput[] = [
    {
      accountCode: "PROCESSOR_CLEARING",
      entryType: "gross_payment",
      direction: "debit",
      amount: payment.amount,
      currency,
      creatorId: payment.creatorId,
      paymentId: payment.paymentId,
    },
    {
      accountCode: "CREATOR_RECEIVABLE",
      entryType: "creator_receivable",
      direction: "credit",
      amount: creatorReceivable,
      currency,
      creatorId: payment.creatorId,
      paymentId: payment.paymentId,
    },
    {
      accountCode: "PLATFORM_REVENUE",
      entryType: "platform_fee",
      direction: "credit",
      amount: platformFee,
      currency,
      creatorId: payment.creatorId,
      paymentId: payment.paymentId,
    },
  ]

  const entries = candidateEntries.filter((entry) => entry.amount > 0)

  return createLedgerTransaction({
    transactionType: "payment_confirmed",
    paymentId: payment.paymentId,
    creatorId: payment.creatorId,
    amount: payment.amount,
    currency,
    occurredAt: payment.confirmedAt,
    entries,
  })
}