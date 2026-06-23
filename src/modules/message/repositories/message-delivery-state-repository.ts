import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export type MessageDeliveryStateRow = {
  message_id: string
  conversation_id: string
  recipient_user_id: string
  delivery_state: string
  delivered_at: string | null
  failed_at: string | null
  failure_reason: string | null
}

export async function insertMessageDeliveryState(input: {
  messageId: string
  conversationId: string
  recipientUserId: string
}): Promise<MessageDeliveryStateRow> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_message_delivery_states")
    .insert({
      message_id: input.messageId,
      conversation_id: input.conversationId,
      recipient_user_id: input.recipientUserId,
      delivery_state: "requested",
      delivered_at: null,
      failed_at: null,
      failure_reason: null,
      authority_mode: "canonical_authoritative",
      runtime_authoritative: true,
      serving_authoritative: true,
      rollback_safe: true,
    })
    .select(
      "message_id, conversation_id, recipient_user_id, delivery_state, delivered_at, failed_at, failure_reason"
    )
    .single<MessageDeliveryStateRow>()

  if (error) {
    throw error
  }

  return data
}

export async function markMessageDeliverySucceeded(input: {
  messageId: string
  recipientUserId: string
  deliveredAt?: string
}): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const deliveredAt = input.deliveredAt ?? new Date().toISOString()

  const { error } = await supabase
    .from("canonical_message_delivery_states")
    .update({
      delivery_state: "delivered",
      delivered_at: deliveredAt,
      failed_at: null,
      failure_reason: null,
    })
    .eq("message_id", input.messageId)
    .eq("recipient_user_id", input.recipientUserId)

  if (error) {
    throw error
  }
}

export async function markMessageDeliveryFailed(input: {
  messageId: string
  recipientUserId: string
  failureReason: string
  failedAt?: string
}): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const failedAt = input.failedAt ?? new Date().toISOString()

  const { error } = await supabase
    .from("canonical_message_delivery_states")
    .update({
      delivery_state: "failed",
      failed_at: failedAt,
      failure_reason: input.failureReason,
    })
    .eq("message_id", input.messageId)
    .eq("recipient_user_id", input.recipientUserId)

  if (error) {
    throw error
  }
}