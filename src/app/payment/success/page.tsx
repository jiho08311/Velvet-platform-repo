import { Suspense } from "react"
import { getPaymentResultPageState } from "@/modules/payment/public/payment-result-state"
import { PaymentSuccessContent } from "@/modules/payment/public/payment-ui"

export default function PaymentSuccessPage() {
  const resultState = getPaymentResultPageState("success")

  return (
    <Suspense fallback={null}>
      <PaymentSuccessContent resultState={resultState} />
    </Suspense>
  )
}
