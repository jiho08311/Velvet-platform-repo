import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import type { MessageSentEventContract } from "@/modules/message/contracts/message-event-contracts"

export async function insertMessageSentOutboxEvent(
  event: MessageSentEventContract
): Promise<void> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("canonical_message_outbox_events")
    .insert({
      event_type: event.type,
      aggregate_type: "message",
      aggregate_id: event.messageId,
      conversation_id: event.conversationId,
      message_id: event.messageId,
      actor_user_id: event.senderId,
      recipient_user_id: event.recipientUserId,
      payload: event,
      publish_state: "pending",
      source_table: "canonical_message_items",
      authority_mode: "canonical_authoritative",
      runtime_authoritative: true,
      serving_authoritative: true,
      rollback_safe: true,
    })

  if (error) {
    throw error
  }
}

export type MessageOutboxEventRow = {
  id: string
  event_type: string
  aggregate_id: string
  conversation_id: string | null
  message_id: string | null
  actor_user_id: string | null
  recipient_user_id: string | null
  payload: MessageSentEventContract
  publish_state: string
  retry_count: number
}

export async function listPendingMessageOutboxEvents(input: {
  limit?: number
} = {}): Promise<MessageOutboxEventRow[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_message_outbox_events")
    .select(
      "id, event_type, aggregate_id, conversation_id, message_id, actor_user_id, recipient_user_id, payload, publish_state, retry_count"
    )
    .eq("publish_state", "pending")
    .order("created_at", { ascending: true })
    .limit(input.limit ?? 20)

  if (error) {
    throw error
  }

  return (data ?? []) as MessageOutboxEventRow[]
}

export async function markMessageOutboxEventPublished(input: {
  eventId: string
}): Promise<void> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("canonical_message_outbox_events")
    .update({
      publish_state: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.eventId)

  if (error) {
    throw error
  }
}

export async function markMessageOutboxEventFailed(input: {
  eventId: string
  errorMessage: string
}): Promise<void> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("canonical_message_outbox_events")
    .update({
      publish_state: "failed",
      last_error: input.errorMessage,
      retry_count: 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.eventId)

  if (error) {
    throw error
  }
}