import type { PaymentProvider } from "@/modules/payment/types"

export type ConfirmedPayment = {
  id: string
  status: "succeeded"
  provider: PaymentProvider
  confirmedAt: string
}

export type PaymentFanoutResult = {
  fanoutStatus: "observed" | "skipped" | "failed"
  sideEffectStatus: "observed" | "skipped" | "failed"
  sideEffectTable?: string | null
  sideEffectRowId?: string | null
  metadata?: Record<string, unknown>
}

export type PaymentConfirmationAssemblyResult = {
  payment: ConfirmedPayment
  subscriptionActivation: PaymentFanoutResult
  settlement: PaymentFanoutResult
  notification: PaymentFanoutResult
}
