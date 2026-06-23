import {
  emitSubscriptionCanceledNotificationEvent,
} from "@/modules/subscription/public/subscription-domain-events"
import { readCreatorIdentityByCreatorId } from "@/modules/identity/public/creator-identity-read-model"

type NotifySubscriptionCanceledWorkflowInput = {
  subscriptionId: string
  creatorId: string
  subscriberId: string
  mode: "period_end" | "immediate"
}

export async function notifySubscriptionCanceledWorkflow({
  subscriptionId,
  creatorId,
  subscriberId,
  mode,
}: NotifySubscriptionCanceledWorkflowInput): Promise<void> {
  const creator = await readCreatorIdentityByCreatorId(creatorId)

  if (!creator?.userId) {
    return
  }

  await emitSubscriptionCanceledNotificationEvent({
    subscriptionId,
    creatorId,
    subscriberId,
    recipientUserId: creator.userId,
    mode,
  })
}
