import { randomUUID } from "crypto"

import {
  PHASE_5_SHADOW_AUTHORITY,
  type DomainEventEnvelope,
} from "@/modules/events/contracts"
import { writeDomainEventWithOutbox } from "@/modules/events/public/write-domain-event-with-outbox"

export type SubscriptionStartedNotificationPayload = {
  subscriptionId: string
  userId: string
  creatorId: string
  recipientUserId: string
}

export type SubscriptionCanceledNotificationPayload = {
  subscriptionId: string
  subscriberId: string
  creatorId: string
  recipientUserId: string
  mode: "period_end" | "immediate"
}

function createSubscriptionNotificationEnvelope<
  TPayload extends Record<string, unknown>,
>(input: {
  eventType: "SubscriptionActivated" | "SubscriptionCancelled"
  subscriptionId: string
  actorUserId: string
  creatorId: string
  recipientUserId: string
  payload: TPayload
}): DomainEventEnvelope<TPayload> {
  const now = new Date().toISOString()
  const eventId = randomUUID()

  return {
    eventId,
    eventType: input.eventType,
    eventVersion: 1,
    aggregate: {
      aggregateType: "subscription",
      aggregateId: input.subscriptionId,
    },
    source: {
      producerModule: "subscription",
      producerSurface: "subscription_workflow",
      sourceFile: "src/workflows/subscription",
      sourceTable: "subscriptions",
      sourceRowId: input.subscriptionId,
    },
    actor: {
      actorType: "user",
      actorId: input.actorUserId,
    },
    subject: {
      userId: input.actorUserId,
      creatorId: input.creatorId,
      recipientUserId: input.recipientUserId,
    },
    correlation: {
      correlationId: eventId,
      causationId: null,
      commandId: null,
      requestId: null,
    },
    timing: {
      occurredAt: now,
      recordedAt: now,
    },
    delivery: {
      idempotencyKey: `${input.eventType}:${input.subscriptionId}:${input.recipientUserId}`,
      outboxRequired: true,
      replayable: true,
    },
    authority: PHASE_5_SHADOW_AUTHORITY,
    payload: input.payload,
    metadata: {
      eventFamily: "subscription_notification",
      legacyRuntimePreserved: false,
      shadowMode: false,
      schemaName: "subscription_notification_v1",
    },
  }
}

export async function emitSubscriptionStartedNotificationEvent(
  payload: SubscriptionStartedNotificationPayload,
): Promise<void> {
  await writeDomainEventWithOutbox(
    createSubscriptionNotificationEnvelope({
      eventType: "SubscriptionActivated",
      subscriptionId: payload.subscriptionId,
      actorUserId: payload.userId,
      creatorId: payload.creatorId,
      recipientUserId: payload.recipientUserId,
      payload,
    }),
  )
}

export async function emitSubscriptionCanceledNotificationEvent(
  payload: SubscriptionCanceledNotificationPayload,
): Promise<void> {
  await writeDomainEventWithOutbox(
    createSubscriptionNotificationEnvelope({
      eventType: "SubscriptionCancelled",
      subscriptionId: payload.subscriptionId,
      actorUserId: payload.subscriberId,
      creatorId: payload.creatorId,
      recipientUserId: payload.recipientUserId,
      payload,
    }),
  )
}
