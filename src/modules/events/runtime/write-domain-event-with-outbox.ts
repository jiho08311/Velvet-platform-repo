import { randomUUID } from "crypto"

import type { DomainEventEnvelope } from "@/modules/events/contracts"
import { insertDomainEvent } from "@/modules/events/repositories/domain-event-repository"
import { insertOutboxEvent } from "@/modules/events/repositories/outbox-event-repository"

export type WriteDomainEventWithOutboxResult = {
  eventId: string
  outboxId: string | null
}

export async function writeDomainEventWithOutbox<
  TPayload extends Record<string, unknown>,
>(
  envelope: DomainEventEnvelope<TPayload>,
): Promise<WriteDomainEventWithOutboxResult> {
  await insertDomainEvent(envelope)

  if (!envelope.delivery.outboxRequired) {
    return {
      eventId: envelope.eventId,
      outboxId: null,
    }
  }

  const outboxId = randomUUID()

  await insertOutboxEvent({
    outboxId,
    eventId: envelope.eventId,
    availableAt: envelope.timing.recordedAt,
  })

  return {
    eventId: envelope.eventId,
    outboxId,
  }
}
