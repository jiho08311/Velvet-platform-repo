import { Suspense } from "react"
import { PaymentSuccessContent } from "./PaymentSuccessContent"

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessContent />
    </Suspense>
  )
}