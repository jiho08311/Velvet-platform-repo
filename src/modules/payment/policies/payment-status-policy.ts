import type { PaymentStatus } from "@/modules/payment/types"

export function isSuccessfulPaymentStatus(status: PaymentStatus): boolean {
  return status === "succeeded"
}

export function isTerminalFailedPaymentStatus(status: PaymentStatus): boolean {
  return status === "failed" || status === "refunded"
}

export function canPaymentUnlockAccess(status: PaymentStatus): boolean {
  return isSuccessfulPaymentStatus(status)
}