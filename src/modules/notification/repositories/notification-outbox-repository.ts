import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export type NotificationOutboxChannel =
  | "IN_APP"
  | "PUSH"
  | "EMAIL"
  | "WEBSOCKET"

export type NotificationOutboxStatus =
  | "PENDING"
  | "PROCESSING"
  | "DELIVERED"
  | "FAILED"
  | "DEAD_LETTER"

export type NotificationOutboxEventRow = {
  outbox_event_id: string
  notification_id: string
  recipient_user_id: string
  channel: NotificationOutboxChannel
  status: NotificationOutboxStatus
  idempotency_key: string
  attempt_count: number
  next_attempt_at: string
  last_error_type: string | null
  last_error_message: string | null
  created_at: string
  updated_at: string
}

type RawNotificationOutboxEventRow = Omit<
  NotificationOutboxEventRow,
  "channel" | "status"
> & {
  channel: string
  status: string
}

function mapNotificationOutboxEventRow(
  row: RawNotificationOutboxEventRow,
): NotificationOutboxEventRow {
  return {
    outbox_event_id: row.outbox_event_id,
    notification_id: row.notification_id,
    recipient_user_id: row.recipient_user_id,
    channel: row.channel as NotificationOutboxChannel,
    status: row.status as NotificationOutboxStatus,
    idempotency_key: row.idempotency_key,
    attempt_count: row.attempt_count,
    next_attempt_at: row.next_attempt_at,
    last_error_type: row.last_error_type,
    last_error_message: row.last_error_message,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function listPendingNotificationOutboxEvents(
  input: {
    limit?: number
  } = {},
): Promise<NotificationOutboxEventRow[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_notification_outbox_events")
    .select(
      [
        "outbox_event_id",
        "notification_id",
        "recipient_user_id",
        "channel",
        "status",
        "idempotency_key",
        "attempt_count",
        "next_attempt_at",
        "last_error_type",
        "last_error_message",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .eq("status", "PENDING")
    .lte("next_attempt_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(input.limit ?? 20)

  if (error) {
    throw error
  }

  return ((data ?? []) as unknown as RawNotificationOutboxEventRow[]).map(
    mapNotificationOutboxEventRow,
  )
}

export async function markNotificationOutboxProcessing(input: {
  outboxEventId: string
}): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from("canonical_notification_outbox_events")
    .update({
      status: "PROCESSING",
      updated_at: now,
    })
    .eq("outbox_event_id", input.outboxEventId)
    .eq("status", "PENDING")

  if (error) {
    throw error
  }
}

export async function markNotificationOutboxDelivered(input: {
  outboxEventId: string
}): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from("canonical_notification_outbox_events")
    .update({
      status: "DELIVERED",
      updated_at: now,
    })
    .eq("outbox_event_id", input.outboxEventId)

  if (error) {
    throw error
  }
}

export async function markNotificationOutboxFailed(input: {
  outboxEventId: string
  attemptCount: number
  errorType: string
  errorMessage: string
  nextAttemptAt: string
}): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from("canonical_notification_outbox_events")
    .update({
      status: "PENDING",
      attempt_count: input.attemptCount,
      next_attempt_at: input.nextAttemptAt,
      last_error_type: input.errorType,
      last_error_message: input.errorMessage,
      updated_at: now,
    })
    .eq("outbox_event_id", input.outboxEventId)

  if (error) {
    throw error
  }
}

export async function insertNotificationDeliveryAttempt(input: {
  outboxEventId: string
  notificationId: string
  channel: NotificationOutboxChannel
  status: "ATTEMPTED" | "DELIVERED" | "FAILED"
  errorType?: string | null
  errorMessage?: string | null
}): Promise<void> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("notification_delivery_attempts")
    .insert({
      outbox_event_id: input.outboxEventId,
      notification_id: input.notificationId,
      channel: input.channel,
      status: input.status,
      error_type: input.errorType ?? null,
      error_message: input.errorMessage ?? null,
      attempted_at: new Date().toISOString(),
    })

  if (error) {
    throw error
  }
}

export async function insertNotificationDeliveryEvent(input: {
  notificationId: string
  recipientUserId: string
  eventType:
    | "NotificationDeliveryAttempted"
    | "NotificationDelivered"
    | "NotificationDeliveryFailed"
  payload: Record<string, unknown>
}): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from("canonical_notification_events")
    .insert({
      notification_id: input.notificationId,
      event_type: input.eventType,
      event_payload: input.payload,
      recipient_user_id: input.recipientUserId,
      source_domain: "notification",
      occurred_at: now,
      created_at: now,
    })

  if (error) {
    throw error
  }
}

export async function markNotificationOutboxDeadLetter(input: {
  outboxEventId: string
  errorType: string
  errorMessage: string
}): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from("canonical_notification_outbox_events")
    .update({
      status: "DEAD_LETTER",
      last_error_type: input.errorType,
      last_error_message: input.errorMessage,
      updated_at: now,
    })
    .eq("outbox_event_id", input.outboxEventId)

  if (error) {
    throw error
  }
}

export async function insertNotificationDeadLetter(input: {
  outboxEventId: string
  notificationId: string
  channel: NotificationOutboxChannel
  errorType: string
  errorMessage: string
  attemptCount: number
  payload?: Record<string, unknown>
}): Promise<void> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("notification_dead_letters")
    .insert({
      outbox_event_id: input.outboxEventId,
      notification_id: input.notificationId,
      channel: input.channel,
      error_type: input.errorType,
      error_message: input.errorMessage,
      attempt_count: input.attemptCount,
      payload: input.payload ?? null,
      dead_lettered_at: new Date().toISOString(),
    })

  if (error) {
    throw error
  }
}