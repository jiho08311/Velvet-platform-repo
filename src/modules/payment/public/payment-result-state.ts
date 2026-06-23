import {
  canPaymentUnlockAccess as canPaymentUnlockAccessRuntime,
  getPaymentResultPageState as getPaymentResultPageStateRuntime,
  isSuccessfulPaymentStatus as isSuccessfulPaymentStatusRuntime,
  isTerminalFailedPaymentStatus as isTerminalFailedPaymentStatusRuntime,
} from "@/modules/payment/policies/payment-result-state"

export const PUBLIC_CONTRACT = true

export type PaymentStatus = Parameters<typeof canPaymentUnlockAccessRuntime>[0]

export type PaymentResultPageState = ReturnType<
  typeof getPaymentResultPageStateRuntime
>

export type PaymentResultPageReason = PaymentResultPageState["reason"]

export function canPaymentUnlockAccess(status: PaymentStatus): boolean {
  return canPaymentUnlockAccessRuntime(status)
}

export function getPaymentResultPageState(
  reason: string | null | undefined
): PaymentResultPageState {
  return getPaymentResultPageStateRuntime(reason)
}

export function isSuccessfulPaymentStatus(status: PaymentStatus): boolean {
  return isSuccessfulPaymentStatusRuntime(status)
}

export function isTerminalFailedPaymentStatus(status: PaymentStatus): boolean {
  return isTerminalFailedPaymentStatusRuntime(status)
}
