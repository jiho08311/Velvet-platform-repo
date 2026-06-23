import { randomUUID } from "crypto"
import { issueMessageAccessGrant } from "@/modules/entitlement/public/access-grants"
import { writeDomainEventWithOutbox } from "@/modules/events/runtime/write-domain-event-with-outbox"
import type {
  EventHandler,
  EventHandlerResult,
} from "@/modules/events/runtime/event-handler-registry"

type PpvMessagePurchasedPayload = {
  paymentId: string
  messageId: string
  conversationId: string
  buyerId: string
  purchasedAt: string
}

function stableHash(input: unknown): string {
  return JSON.stringify(input)
}

export const ppvMessagePurchasedEntitlementHandler: EventHandler = {
  handlerName: "PpvMessagePurchasedEntitlementConsumer",
  eventTypes: ["PpvMessagePurchased"],

  async handle(event): Promise<EventHandlerResult> {
    const payload = event.payload as PpvMessagePurchasedPayload
    const grantedAt = payload.purchasedAt ?? new Date().toISOString()

    await issueMessageAccessGrant({
      viewerUserId: payload.buyerId,
      messageId: payload.messageId,
      conversationId: payload.conversationId,
      paymentId: payload.paymentId,
      grantedAt,
      sourceType: "ppv_message_purchased_event",
      metadata: {
        sourceEventId: event.event_id,
        runtimeSurface: "events.ppv-message-purchased-entitlement-handler",
      },
    })

    await writeDomainEventWithOutbox({
      eventId: randomUUID(),
      eventType: "MessageAccessGranted",
      eventVersion: 1,
      aggregate: {
        aggregateType: "entitlement",
        aggregateId: payload.messageId,
      },
      source: {
        producerModule: "entitlement",
        producerSurface: "PpvMessagePurchasedEntitlementConsumer",
        sourceFile:
          "src/modules/events/handlers/ppv-message-purchased-entitlement-handler.ts",
        sourceTable: "message_access_grants",
        sourceRowId: payload.messageId,
      },
      actor: {
        actorType: "system",
        actorId: null,
      },
      subject: {
        userId: payload.buyerId,
        creatorId: null,
        recipientUserId: null,
      },
      correlation: {
        correlationId: payload.paymentId,
        causationId: event.event_id,
        commandId: null,
        requestId: null,
      },
      timing: {
        occurredAt: grantedAt,
        recordedAt: new Date().toISOString(),
      },
      delivery: {
        idempotencyKey: `message:${payload.messageId}:access-granted:${payload.buyerId}`,
        outboxRequired: true,
        replayable: true,
      },
      authority: {
        runtimeAuthoritative: true,
        canonicalAuthoritative: true,
        projectionAuthoritative: true,
        servingAuthoritative: false,
        replayAuthoritative: true,
        promotionAllowed: true,
        rollbackSafe: true,
        failOpen: false,
      },
      payload: {
        paymentId: payload.paymentId,
        messageId: payload.messageId,
        conversationId: payload.conversationId,
        principalId: payload.buyerId,
        grantReason: "PPV_PURCHASE",
        sourceEventId: event.event_id,
        grantedAt,
      },
      metadata: {
        eventFamily: "message_access",
        legacyRuntimePreserved: false,
        shadowMode: false,
      },
    })

    return {
      status: "completed",
      resultHash: stableHash({
        handlerName: "PpvMessagePurchasedEntitlementConsumer",
        eventId: event.event_id,
        paymentId: payload.paymentId,
        messageId: payload.messageId,
        buyerId: payload.buyerId,
      }),
    }
  },
}
