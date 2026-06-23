import { writeDomainEventWithOutbox } from "@/modules/events/public/write-domain-event-with-outbox"
import type { MessageOutboxEventRow } from "@/modules/message/repositories/message-outbox-repository"
import type { DomainEventType } from "@/modules/events/contracts/domain-event-types"
export async function bridgeMessageOutboxEventToDomainOutbox(
  event: MessageOutboxEventRow
): Promise<void> {
  const eventId = event.id
  const now = new Date().toISOString()

  await writeDomainEventWithOutbox({
    eventId,
  eventType: "message.sent" as DomainEventType,
    eventVersion: 1,
    aggregate: {
      aggregateType: "message",
      aggregateId: event.aggregate_id,
    },
    source: {
      producerModule: "message",
      producerSurface: "canonical_message_outbox_events",
      sourceFile:
        "src/modules/message/repositories/message-domain-event-bridge-repository.ts",
      sourceTable: "canonical_message_outbox_events",
      sourceRowId: event.id,
    },
    actor: {
      actorType: "user",
      actorId: event.actor_user_id,
    },
    subject: {
      userId: event.actor_user_id,
      creatorId: null,
      recipientUserId: event.recipient_user_id,
    },
    correlation: {
      correlationId: event.id,
      causationId: event.id,
      commandId: null,
      requestId: null,
    },
    timing: {
      occurredAt: now,
      recordedAt: now,
    },
    delivery: {
      idempotencyKey: `message:${event.id}:domain-event`,
      outboxRequired: true,
      replayable: true,
    },
    authority: {
      runtimeAuthoritative: true,
      canonicalAuthoritative: true,
      projectionAuthoritative: false,
      servingAuthoritative: false,
      replayAuthoritative: true,
      promotionAllowed: true,
      rollbackSafe: true,
      failOpen: false,
    },
    payload: event.payload as unknown as Record<string, unknown>,
metadata: {
  legacyRuntimePreserved: false,
  shadowMode: false,
  diagnostics: {
    sourceMessageOutboxId: event.id,
  },
},
  })

}
