import { createLedgerTransaction } from "@/modules/ledger/services/ledger-transaction-service"
import {
  findPaymentConfirmedLedgerTransactionByPaymentId,
  insertChargebackEvent,
  insertLedgerAdjustment,
} from "@/modules/ledger/repositories/ledger-adjustment-repository"
import type { LedgerEntryInput } from "@/modules/ledger/types"
import type { PaymentType } from "@/modules/payment/types"

type CreateChargebackLedgerAdjustmentInput = {
  paymentId: string
  creatorId: string | null
  type: PaymentType
  amount: number
  currency: string
  occurredAt: string
  providerReference?: string | null
  reason?: string | null
}

function getPlatformFeeRateBps(type: PaymentType): number {
  if (type === "subscription") return 2000
  if (type === "ppv_post") return 1000
  if (type === "ppv_message") return 1000
  if (type === "tip") return 1000

  return 0
}

export async function createChargebackLedgerAdjustment({
  paymentId,
  creatorId,
  type,
  amount,
  currency,
  occurredAt,
  providerReference,
  reason,
}: CreateChargebackLedgerAdjustmentInput) {
  const originalTransaction =
    await findPaymentConfirmedLedgerTransactionByPaymentId(paymentId)

  if (!originalTransaction) {
    throw new Error("ORIGINAL_PAYMENT_LEDGER_TRANSACTION_NOT_FOUND")
  }

  const chargebackEvent = await insertChargebackEvent({
    paymentId,
    creatorId,
    amount,
    currency,
    providerReference: providerReference ?? null,
    reason: reason ?? null,
    occurredAt,
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
      entryType: "chargeback_reversal",
      direction: "debit",
      amount: creatorReceivable,
      currency,
      creatorId,
      paymentId,
    },
    {
      accountCode: "PLATFORM_REVENUE",
      entryType: "chargeback_reversal",
      direction: "debit",
      amount: platformFee,
      currency,
      creatorId,
      paymentId,
    },
    {
      accountCode: "PROCESSOR_CLEARING",
      entryType: "chargeback_reversal",
      direction: "credit",
      amount,
      currency,
      creatorId,
      paymentId,
    },
  ]

  const entries = candidateEntries.filter((entry) => entry.amount > 0)

  const adjustmentTransaction = await createLedgerTransaction({
    transactionType: "chargeback",
    paymentId,
    creatorId,
    amount,
    currency,
    referenceTransactionId: originalTransaction.id,
    occurredAt,
    entries,
  })

  const adjustment = await insertLedgerAdjustment({
    originalTransactionId: originalTransaction.id,
    adjustmentTransactionId: adjustmentTransaction.id,
    adjustmentType: "chargeback",
    chargebackEventId: chargebackEvent.id,
    reason: reason ?? null,
  })

  return {
    chargebackEvent,
    adjustmentTransaction,
    adjustment,
  }
}