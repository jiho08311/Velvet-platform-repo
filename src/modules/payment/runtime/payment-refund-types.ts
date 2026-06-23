import type { findPaymentForRefundById } from "@/modules/payment/repositories/payment-read-repository"

export type RefundablePaymentRow = NonNullable<
  Awaited<ReturnType<typeof findPaymentForRefundById>>
>
