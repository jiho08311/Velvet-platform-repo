import type { DomainEventEnvelope } from "@/modules/events/contracts"
import {
  writeDomainEventWithOutbox as writeDomainEventWithOutboxRuntime,
  type WriteDomainEventWithOutboxResult,
} from "@/modules/events/runtime/write-domain-event-with-outbox"

export const PUBLIC_CONTRACT = true

export type { WriteDomainEventWithOutboxResult }

export async function writeDomainEventWithOutbox<
  TPayload extends Record<string, unknown>,
>(
  envelope: DomainEventEnvelope<TPayload>
): Promise<WriteDomainEventWithOutboxResult> {
  return writeDomainEventWithOutboxRuntime(envelope)
}
