import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type InsertOutboxEventInput = {
  outboxId: string
  eventId: string
  availableAt: string
  maxAttempts?: number
}

export type InsertOutboxEventResult = {
  outboxId: string
}

export async function insertOutboxEvent({
  outboxId,
  eventId,
  availableAt,
  maxAttempts = 10,
}: InsertOutboxEventInput): Promise<InsertOutboxEventResult> {
  const { error } = await supabaseAdmin
    .from("outbox_events")
    .insert({
      outbox_id: outboxId,
      event_id: eventId,
      status: "pending",
      available_at: availableAt,
      attempts: 0,
      max_attempts: maxAttempts,
    })

  if (error) throw error

  return {
    outboxId,
  }
}
