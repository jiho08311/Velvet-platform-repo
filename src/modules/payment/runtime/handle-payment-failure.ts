import {
  handlePaymentFailureService,
  type FailedPayment,
  type HandlePaymentFailureInput,
} from "@/modules/payment/services/payment-failure-service"

export type { FailedPayment, HandlePaymentFailureInput }

export async function handlePaymentFailure(
  input: HandlePaymentFailureInput
): Promise<FailedPayment | null> {
  return handlePaymentFailureService(input)
}
