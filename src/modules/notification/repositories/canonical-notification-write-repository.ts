import { randomUUID } from "crypto"

import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { NotificationData, NotificationType } from "../types"

export type InsertCanonicalNotificationInput = {
  userId: string
  type: NotificationType
  title: string
  body: string
  data: NotificationData
  sourceDomain?: string
  sourceEntityType?: string | null
  sourceEntityId?: string | null
  actorUserId?: string | null
  correlationId?: string | null
}

export async function insertCanonicalNotification(
  input: InsertCanonicalNotificationInput,
): Promise<{ notificationId: string }> {
  const notificationId = randomUUID()
  const now = new Date().toISOString()

  const { error: itemError } = await supabaseAdmin
    .from("canonical_notification_items")
    .insert({
      notification_id: notificationId,
      user_id: input.userId,
      recipient_user_id: input.userId,
      notification_type: input.type,
      title: input.title,
      body: input.body,
      payload: input.data,
      source_domain: input.sourceDomain ?? "system",
      source_entity_type: input.sourceEntityType ?? null,
      source_entity_id: input.sourceEntityId ?? null,
      authority_mode: "canonical_authoritative",
      runtime_authoritative: true,
      serving_authoritative: true,
      rollback_safe: true,
      created_at: now,
      updated_at: now,
    })

  if (itemError) {
    throw itemError
  }

  const { error: readStateError } = await supabaseAdmin
    .from("canonical_notification_read_states")
    .insert({
      notification_id: notificationId,
      recipient_user_id: input.userId,
      read_state: "unread",
      read_at: null,
      created_at: now,
      updated_at: now,
    })

  if (readStateError) {
    throw readStateError
  }

  const { error: visibilityError } = await supabaseAdmin
    .from("canonical_notification_visibility_states")
    .insert({
      notification_id: notificationId,
      recipient_user_id: input.userId,
      visibility_state: "visible",
      visibility_reason: null,
      created_at: now,
      updated_at: now,
    })

  if (visibilityError) {
    throw visibilityError
  }



  const { error: eventError } = await supabaseAdmin
    .from("canonical_notification_events")
    .insert({
      notification_id: notificationId,
      event_type: "NotificationCreated",
      event_payload: {
        type: input.type,
        title: input.title,
        body: input.body,
        payload: input.data,
      },
      actor_user_id: input.actorUserId ?? null,
      recipient_user_id: input.userId,
      source_domain: input.sourceDomain ?? "system",
      correlation_id: input.correlationId ?? null,
      occurred_at: now,
      created_at: now,
    })

  if (eventError) {
    throw eventError
  }


  const channel = "IN_APP"
  const idempotencyKey = `${notificationId}:${channel}`

  const { error: queuedEventError } = await supabaseAdmin
    .from("canonical_notification_events")
    .insert({
      notification_id: notificationId,
      event_type: "NotificationQueued",
      event_payload: {
        notificationId,
        channel,
        queuedAt: now,
      },
      actor_user_id: input.actorUserId ?? null,
      recipient_user_id: input.userId,
      source_domain: "notification",
      correlation_id: input.correlationId ?? null,
      occurred_at: now,
      created_at: now,
    })

  if (queuedEventError) {
    throw queuedEventError
  }

  const { error: outboxError } = await supabaseAdmin
    .from("canonical_notification_outbox_events")
    .insert({
      notification_id: notificationId,
      recipient_user_id: input.userId,
      channel,
      status: "PENDING",
      idempotency_key: idempotencyKey,
      attempt_count: 0,
      next_attempt_at: now,
      created_at: now,
      updated_at: now,
    })

  if (outboxError) {
    throw outboxError
  }



  return { notificationId }
}




export async function updateCanonicalNotificationReadState(input: {
  notificationId: string
  recipientUserIds: string[]
  readAt: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_notification_read_states")
    .update({
      read_state: "read",
      read_at: input.readAt,
      updated_at: input.readAt,
    })
    .eq("notification_id", input.notificationId)
    .in("recipient_user_id", input.recipientUserIds)

  if (error) {
    throw error
  }
}

export async function insertCanonicalNotificationReadEvent(input: {
  notificationId: string
  recipientUserId: string
  readAt: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_notification_events")
    .insert({
      notification_id: input.notificationId,
      event_type: "NotificationRead",
      event_payload: {
        readAt: input.readAt,
      },
      recipient_user_id: input.recipientUserId,
      source_domain: "notification",
      occurred_at: input.readAt,
      created_at: input.readAt,
    })

  if (error) {
    throw error
  }
}

export async function updateUnreadCanonicalNotificationsReadForRecipients(input: {
  recipientUserIds: string[]
  readAt: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_notification_read_states")
    .update({
      read_state: "read",
      read_at: input.readAt,
      updated_at: input.readAt,
    })
    .in("recipient_user_id", input.recipientUserIds)
    .eq("read_state", "unread")

  if (error) {
    throw error
  }
}

export async function insertCanonicalAllNotificationsReadEvent(input: {
  recipientUserId: string
  readAt: string
  notificationCount: number
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_notification_events")
    .insert({
      notification_id: crypto.randomUUID(),
      event_type: "AllNotificationsRead",
      event_payload: {
        notificationCount: input.notificationCount,
        readAt: input.readAt,
      },
      recipient_user_id: input.recipientUserId,
      source_domain: "notification",
      occurred_at: input.readAt,
      created_at: input.readAt,
    })

  if (error) {
    throw error
  }
}

export async function updateCanonicalNotificationVisibilityDeleted(input: {
  notificationId: string
  recipientUserIds: string[]
  deletedAt: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_notification_visibility_states")
    .update({
      visibility_state: "deleted",
      visibility_reason: "user_deleted",
      deleted_at: input.deletedAt,
      updated_at: input.deletedAt,
    })
    .eq("notification_id", input.notificationId)
    .in("recipient_user_id", input.recipientUserIds)

  if (error) {
    throw error
  }
}

export async function insertCanonicalNotificationDeletedEvent(input: {
  notificationId: string
  recipientUserId: string
  deletedAt: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_notification_events")
    .insert({
      notification_id: input.notificationId,
      event_type: "NotificationDeleted",
      event_payload: {
        deletedAt: input.deletedAt,
      },
      recipient_user_id: input.recipientUserId,
      source_domain: "notification",
      occurred_at: input.deletedAt,
      created_at: input.deletedAt,
    })

  if (error) {
    throw error
  }
}