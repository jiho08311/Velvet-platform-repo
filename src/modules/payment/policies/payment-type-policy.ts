import type { PaymentStatus, PaymentType } from "@/modules/payment/types"

const paymentTypeLabels: Record<PaymentType, string> = {
  subscription: "Subscription",
  tip: "Tip",
  ppv_post: "Post purchase",
  ppv_message: "Message purchase",
}

const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Pending",
  succeeded: "Succeeded",
  failed: "Failed",
  refunded: "Refunded",
}

export function isSettlablePaymentType(type: PaymentType): boolean {
  return (
    type === "subscription" ||
    type === "ppv_post" ||
    type === "ppv_message" ||
    type === "tip"
  )
}

export function getPaymentTypeLabel(type: PaymentType): string {
  return paymentTypeLabels[type]
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  return paymentStatusLabels[status]
}