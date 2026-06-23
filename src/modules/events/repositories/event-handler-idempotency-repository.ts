import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type EventHandlerIdempotencyStatus =
  | "processing"
  | "completed"
  | "failed"
  | "skipped"

export async function tryStartEventHandler(input: {
  eventId: string
  handlerName: string
  idempotencyKey: string
}): Promise<{ started: boolean; status?: EventHandlerIdempotencyStatus }> {
  const { error } = await supabaseAdmin
    .from("event_handler_idempotency")
    .insert({
      event_id: input.eventId,
      handler_name: input.handlerName,
      idempotency_key: input.idempotencyKey,
      status: "processing",
    })

  if (!error) return { started: true }

  if (error.code !== "23505") throw error

  const { data, error: readError } = await supabaseAdmin
    .from("event_handler_idempotency")
    .select("status")
    .eq("event_id", input.eventId)
    .eq("handler_name", input.handlerName)
    .maybeSingle<{ status: EventHandlerIdempotencyStatus }>()

  if (readError) throw readError

  return {
    started: false,
    status: data?.status,
  }
}

export async function completeEventHandler(input: {
  eventId: string
  handlerName: string
  resultHash?: string | null
}): Promise<void> {
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from("event_handler_idempotency")
    .update({
      status: "completed",
      completed_at: now,
      result_hash: input.resultHash ?? null,
      updated_at: now,
    })
    .eq("event_id", input.eventId)
    .eq("handler_name", input.handlerName)

  if (error) throw error
}

export async function failEventHandler(input: {
  eventId: string
  handlerName: string
  errorMessage: string
}): Promise<void> {
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from("event_handler_idempotency")
    .update({
      status: "failed",
      failed_at: now,
      error_message: input.errorMessage,
      updated_at: now,
    })
    .eq("event_id", input.eventId)
    .eq("handler_name", input.handlerName)

  if (error) throw error
}
