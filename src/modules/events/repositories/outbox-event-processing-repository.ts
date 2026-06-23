import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { ClaimedOutboxEvent } from "@/modules/events/contracts/claimed-outbox-event"

export async function claimOutboxEvents(input: {
  workerId: string
  batchSize?: number
}): Promise<ClaimedOutboxEvent[]> {
  const { data, error } = await supabaseAdmin.rpc("claim_outbox_events", {
    p_worker_id: input.workerId,
    p_batch_size: input.batchSize ?? 25,
  })

  if (error) throw error

  return (data ?? []) as ClaimedOutboxEvent[]
}

export async function markOutboxProcessed(outboxId: string): Promise<void> {
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from("outbox_events")
    .update({
      status: "processed",
      processed_at: now,
      locked_at: null,
      locked_by: null,
      updated_at: now,
    })
    .eq("outbox_id", outboxId)

  if (error) throw error
}

export async function markOutboxSkipped(input: {
  outboxId: string
  reason: string
}): Promise<void> {
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from("outbox_events")
    .update({
      status: "skipped",
      last_error: input.reason,
      locked_at: null,
      locked_by: null,
      updated_at: now,
    })
    .eq("outbox_id", input.outboxId)

  if (error) throw error
}

export async function scheduleOutboxRetry(input: {
  outboxId: string
  errorMessage: string
  availableAt: string
}): Promise<void> {
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from("outbox_events")
    .update({
      status: "retry_scheduled",
      available_at: input.availableAt,
      last_error: input.errorMessage,
      last_error_at: now,
      locked_at: null,
      locked_by: null,
      updated_at: now,
    })
    .eq("outbox_id", input.outboxId)

  if (error) throw error
}

export async function markOutboxDeadLetter(input: {
  outboxId: string
  errorMessage: string
}): Promise<void> {
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from("outbox_events")
    .update({
      status: "dead_letter",
      dead_lettered_at: now,
      last_error: input.errorMessage,
      last_error_at: now,
      locked_at: null,
      locked_by: null,
      updated_at: now,
    })
    .eq("outbox_id", input.outboxId)

  if (error) throw error
}
