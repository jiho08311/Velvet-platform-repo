import type { PaymentProvider } from "@/modules/payment/types"
import { upsertSubscription } from "@/modules/subscription/public/upsert-subscription"

function addOneMonth(isoString: string): string {
  const date = new Date(isoString)
  date.setMonth(date.getMonth() + 1)
  return date.toISOString()
}

export async function activateSubscriptionFromPayment(payment: {
  id: string
  user_id: string
  creator_id: string | null
  provider: PaymentProvider
  confirmed_at: string | null
}) {
  if (!payment.creator_id) {
    return null
  }

  const currentPeriodStart = payment.confirmed_at ?? new Date().toISOString()

  return upsertSubscription({
    userId: payment.user_id,
    creatorId: payment.creator_id,
    status: "active",
    provider: payment.provider,
    providerSubscriptionId: payment.id,
    currentPeriodStart,
    currentPeriodEnd: addOneMonth(currentPeriodStart),
    cancelAtPeriodEnd: false,
  })
}
