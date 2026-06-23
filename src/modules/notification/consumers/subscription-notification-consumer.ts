import type { DomainEventEnvelope } from "@/modules/events/contracts"
import {
  createSubscriptionCanceledNotificationInput,
  createSubscriptionStartedNotificationInput,
} from "@/modules/notification/public/create-notification-input"
import {
  insertCanonicalNotification,
} from "@/modules/notification/repositories/canonical-notification-write-repository"

type SubscriptionStartedPayload = {
  subscriptionId: string
  userId: string
  creatorId: string
  recipientUserId: string
}

type SubscriptionCanceledPayload = {
  subscriptionId: string
  subscriberId: string
  creatorId: string
  recipientUserId: string
  mode: "period_end" | "immediate"
}

function isSubscriptionActivatedEvent(
  event: DomainEventEnvelope<Record<string, unknown>>,
): event is DomainEventEnvelope<SubscriptionStartedPayload> {
  return event.eventType === "SubscriptionActivated"
}

function isSubscriptionCancelledEvent(
  event: DomainEventEnvelope<Record<string, unknown>>,
): event is DomainEventEnvelope<SubscriptionCanceledPayload> {
  return event.eventType === "SubscriptionCancelled"
}

export async function consumeSubscriptionNotificationEvent(
  event: DomainEventEnvelope<Record<string, unknown>>,
): Promise<void> {
  if (isSubscriptionActivatedEvent(event)) {
    const notificationInput = createSubscriptionStartedNotificationInput({
      userId: event.payload.recipientUserId,
      subscriptionId: event.payload.subscriptionId,
    })

    await insertCanonicalNotification({
      userId: notificationInput.userId,
      type: notificationInput.type,
      title: notificationInput.title,
      body: notificationInput.body,
      data: notificationInput.data ?? {},
      sourceDomain: "subscription",
      sourceEntityType: "subscription",
      sourceEntityId: event.payload.subscriptionId,
      actorUserId: event.payload.userId,
      correlationId: event.correlation.correlationId,
    })

    return
  }

  if (isSubscriptionCancelledEvent(event)) {
    const notificationInput = createSubscriptionCanceledNotificationInput({
      userId: event.payload.recipientUserId,
      creatorId: event.payload.creatorId,
      subscriberId: event.payload.subscriberId,
      subscriptionId: event.payload.subscriptionId,
      mode: event.payload.mode,
    })

    await insertCanonicalNotification({
      userId: notificationInput.userId,
      type: notificationInput.type,
      title: notificationInput.title,
      body: notificationInput.body,
      data: notificationInput.data ?? {},
      sourceDomain: "subscription",
      sourceEntityType: "subscription",
      sourceEntityId: event.payload.subscriptionId,
      actorUserId: event.payload.subscriberId,
      correlationId: event.correlation.correlationId,
    })
  }
}