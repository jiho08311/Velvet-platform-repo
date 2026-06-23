import type { DomainEventEnvelope } from "@/modules/events/contracts"
import type {
  EventHandler,
  EventHandlerResult,
} from "@/modules/events/runtime/event-handler-registry"
import type { ClaimedOutboxEvent } from "@/modules/events/contracts"
import { consumePaymentNotificationEvent } from "@/modules/notification/consumers/payment-notification-consumer"
import { consumePostInteractionNotificationEvent } from "@/modules/notification/consumers/post-interaction-notification-consumer"
import { consumeSubscriptionNotificationEvent } from "@/modules/notification/consumers/subscription-notification-consumer"

function toNotificationConsumerEnvelope(
  event: ClaimedOutboxEvent,
): DomainEventEnvelope<Record<string, unknown>> {
  const now = new Date().toISOString()

  return {
    eventId: event.event_id,
    eventType: event.event_type as DomainEventEnvelope<
      Record<string, unknown>
    >["eventType"],
    eventVersion: event.event_version,
    aggregate: {
      aggregateType: event.aggregate_type as DomainEventEnvelope<
        Record<string, unknown>
      >["aggregate"]["aggregateType"],
      aggregateId: event.aggregate_id,
    },
    source: {
      producerModule: String(event.metadata?.producerModule ?? "unknown"),
      producerSurface: String(event.metadata?.producerSurface ?? "outbox"),
      sourceTable: null,
      sourceRowId: event.aggregate_id,
    },
    actor: {
      actorType: "system",
      actorId: null,
    },
    subject: {},
    correlation: {
      correlationId: event.event_id,
      causationId: null,
      commandId: null,
      requestId: null,
    },
    timing: {
      occurredAt: now,
      recordedAt: now,
    },
    delivery: {
      idempotencyKey: event.event_id,
      outboxRequired: true,
      replayable: true,
    },
    authority: {
      runtimeAuthoritative: true,
      canonicalAuthoritative: false,
      projectionAuthoritative: false,
      servingAuthoritative: false,
      replayAuthoritative: false,
      promotionAllowed: false,
      rollbackSafe: true,
      failOpen: true,
    },
    payload: event.payload,
    metadata: {
      legacyRuntimePreserved: false,
      shadowMode: false,
    },
  }
}

async function handleNotificationConsumerEvent(
  event: ClaimedOutboxEvent,
): Promise<EventHandlerResult> {
  const envelope = toNotificationConsumerEnvelope(event)

  if (
    event.event_type === "PostLiked" ||
    event.event_type === "CommentLiked" ||
    event.event_type === "CommentCreated"
  ) {
    await consumePostInteractionNotificationEvent(envelope)

    return {
      status: "completed",
      resultHash: `notification:${event.event_id}`,
    }
  }

  if (event.event_type === "PaymentConfirmed") {
    await consumePaymentNotificationEvent(envelope)

    return {
      status: "completed",
      resultHash: `notification:${event.event_id}`,
    }
  }

  if (
    event.event_type === "SubscriptionActivated" ||
    event.event_type === "SubscriptionCancelled"
  ) {
    await consumeSubscriptionNotificationEvent(envelope)

    return {
      status: "completed",
      resultHash: `notification:${event.event_id}`,
    }
  }

  return {
    status: "skipped",
    reason: `unsupported_notification_event:${event.event_type}`,
  }
}

export const notificationDomainEventConsumerHandler: EventHandler = {
  handlerName: "notification_domain_event_consumer",
  eventTypes: [
    "PostLiked",
    "CommentLiked",
    "CommentCreated",
    "PaymentConfirmed",
    "SubscriptionActivated",
    "SubscriptionCancelled",
  ],
  handle: handleNotificationConsumerEvent,
}
