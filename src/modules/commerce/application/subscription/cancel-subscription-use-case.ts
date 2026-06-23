import { cancelCanonicalSubscription } from "@/modules/commerce/internal/adapters/subscription-adapter"
import { getSubscriptionUseCase } from "@/modules/commerce/application/subscription/get-subscription-use-case"
import type {
  CancelSubscriptionInput,
  CancelSubscriptionResult,
} from "@/modules/commerce/public/subscription-contract"

export async function cancelSubscriptionUseCase(
  input: CancelSubscriptionInput
): Promise<CancelSubscriptionResult> {
  const updated = await cancelCanonicalSubscription({
    subscriberUserId: input.subscriberUserId,
    creatorId: input.creatorId,
  })

  if (!updated) {
    throw new Error("SUBSCRIPTION_CANCEL_FAILED")
  }

  const { subscription } = await getSubscriptionUseCase({
    subscriptionId: updated.id,
  })

  if (!subscription) {
    throw new Error("SUBSCRIPTION_CANCEL_POSTCONDITION_FAILED")
  }

  return {
    subscription,
  }
}