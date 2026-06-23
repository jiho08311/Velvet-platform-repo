import { createLedgerTransaction } from "@/modules/ledger/services/ledger-transaction-service"
import {
  findPaymentConfirmedLedgerTransactionByPaymentId,
  insertLedgerAdjustment,
  insertRefundEvent,
} from "@/modules/ledger/repositories/ledger-adjustment-repository"
import type { LedgerEntryInput } from "@/modules/ledger/types"
import type { PaymentType } from "@/modules/payment/types"

type CreateRefundLedgerAdjustmentInput = {
  paymentId: string
  creatorId: string | null
  userId: string
  type: PaymentType
  amount: number
  currency: string
  refundedAt: string
  reason?: string | null
}

function getPlatformFeeRateBps(type: PaymentType): number {
  if (type === "subscription") return 2000
  if (type === "ppv_post") return 1000
  if (type === "ppv_message") return 1000
  if (type === "tip") return 1000

  return 0
}

export async function createRefundLedgerAdjustment({
  paymentId,
  creatorId,
  type,
  amount,
  currency,
  refundedAt,
  reason,
}: CreateRefundLedgerAdjustmentInput) {
  const originalTransaction =
    await findPaymentConfirmedLedgerTransactionByPaymentId(paymentId)

  if (!originalTransaction) {
    throw new Error("ORIGINAL_PAYMENT_LEDGER_TRANSACTION_NOT_FOUND")
  }

  const refundEvent = await insertRefundEvent({
    paymentId,
    creatorId,
    amount,
    currency,
    providerReference: null,
    reason: reason ?? null,
    occurredAt: refundedAt,
  })

  const platformFee = Math.floor(
    (amount * getPlatformFeeRateBps(type)) / 10000
  )

  const taxHold = 0
  const processorFee = 0
  const creatorReceivable = amount - platformFee - taxHold - processorFee

  const candidateEntries: LedgerEntryInput[] = [
    {
      accountCode: "CREATOR_RECEIVABLE",
      entryType: "refund_reversal",
      direction: "debit",
      amount: creatorReceivable,
      currency,
      creatorId,
      paymentId,
    },
    {
      accountCode: "PLATFORM_REVENUE",
      entryType: "refund_reversal",
      direction: "debit",
      amount: platformFee,
      currency,
      creatorId,
      paymentId,
    },
    {
      accountCode: "PROCESSOR_CLEARING",
      entryType: "refund_reversal",
      direction: "credit",
      amount,
      currency,
      creatorId,
      paymentId,
    },
  ]

  const entries = candidateEntries.filter((entry) => entry.amount > 0)

  const adjustmentTransaction = await createLedgerTransaction({
    transactionType: "refund",
    paymentId,
    creatorId,
    amount,
    currency,
    referenceTransactionId: originalTransaction.id,
    occurredAt: refundedAt,
    entries,
  })

  const adjustment = await insertLedgerAdjustment({
    originalTransactionId: originalTransaction.id,
    adjustmentTransactionId: adjustmentTransaction.id,
    adjustmentType: "refund",
    refundEventId: refundEvent.id,
    reason: reason ?? null,
  })

  return {
    refundEvent,
    adjustmentTransaction,
    adjustment,
  }
}