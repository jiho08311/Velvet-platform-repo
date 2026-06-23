import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { DomainEventEnvelope } from "@/modules/events/contracts"

export type InsertDomainEventResult = {
  eventId: string
}

export async function insertDomainEvent<TPayload extends Record<string, unknown>>(
  envelope: DomainEventEnvelope<TPayload>,
): Promise<InsertDomainEventResult> {
  const { error } = await supabaseAdmin
    .from("domain_events")
    .insert({
      event_id: envelope.eventId,
      event_type: envelope.eventType,
      event_version: envelope.eventVersion,

      aggregate_type: envelope.aggregate.aggregateType,
      aggregate_id: envelope.aggregate.aggregateId,

      producer_module: envelope.source.producerModule,
      producer_surface: envelope.source.producerSurface,
      source_file: envelope.source.sourceFile ?? null,
      source_table: envelope.source.sourceTable ?? null,
      source_row_id: envelope.source.sourceRowId ?? null,

      actor_type: envelope.actor.actorType,
      actor_id: envelope.actor.actorId,

      subject_user_id: envelope.subject.userId ?? null,
      subject_creator_id: envelope.subject.creatorId ?? null,
      subject_recipient_user_id: envelope.subject.recipientUserId ?? null,

      correlation_id: envelope.correlation.correlationId,
      causation_id: envelope.correlation.causationId,
      command_id: envelope.correlation.commandId,
      request_id: envelope.correlation.requestId,

      occurred_at: envelope.timing.occurredAt,
      recorded_at: envelope.timing.recordedAt,

      idempotency_key: envelope.delivery.idempotencyKey,
      outbox_required: envelope.delivery.outboxRequired,
      replayable: envelope.delivery.replayable,

      runtime_authoritative: envelope.authority.runtimeAuthoritative,
      canonical_authoritative: envelope.authority.canonicalAuthoritative,
      projection_authoritative: envelope.authority.projectionAuthoritative,
      serving_authoritative: envelope.authority.servingAuthoritative,
      replay_authoritative: envelope.authority.replayAuthoritative,
      promotion_allowed: envelope.authority.promotionAllowed,
      rollback_safe: envelope.authority.rollbackSafe,
      fail_open: envelope.authority.failOpen,

      payload: envelope.payload,
      metadata: envelope.metadata,

      legacy_runtime_preserved: envelope.metadata.legacyRuntimePreserved,
      shadow_mode: envelope.metadata.shadowMode,
    })

  if (error) throw error

  return {
    eventId: envelope.eventId,
  }
}