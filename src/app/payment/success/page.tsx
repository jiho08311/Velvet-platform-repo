import { Suspense } from "react"
import { getPaymentResultPageState } from "@/modules/payment/server/payment-result-state"
import { PaymentSuccessContent } from "@/modules/payment/ui/payment-success-content"

export default function PaymentSuccessPage() {
  const resultState = getPaymentResultPageState("success")

  return (
    <Suspense fallback={null}>
      <PaymentSuccessContent resultState={resultState} />
    </Suspense>
  )
}
