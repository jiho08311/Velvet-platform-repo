import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type MessageMediaRow = {
  id: string
  message_id: string | null
  storage_path: string
  mime_type: string | null
}

export type ModerationMediaRow = {
  id: string
  storage_path: string
  mime_type: string | null
}

export type AttachmentEligibilityMediaRow = {
  id: string
  owner_user_id: string | null
  post_id: string | null
  message_id: string | null
  status: "processing" | "ready" | "failed" | null
  processing_status: "processing" | "ready" | "failed" | null
  moderation_status: "pending" | "approved" | "rejected" | "needs_review" | null
}

export async function findModerationMediaRowsByIds(
  mediaIds: string[]
): Promise<ModerationMediaRow[]> {
  const { data, error } = await supabaseAdmin
    .from("media")
    .select("id, storage_path, mime_type")
    .in("id", mediaIds)

  if (error) throw error
  return data ?? []
}

export async function findMessageAttachmentEligibilityRowsByIds(
  mediaIds: string[]
): Promise<AttachmentEligibilityMediaRow[]> {
  const { data, error } = await supabaseAdmin
    .from("media")
    .select(
      "id, owner_user_id, post_id, message_id, status, processing_status, moderation_status"
    )
    .in("id", mediaIds)

  if (error) throw error
  return data ?? []
}

export async function attachMediaRowsToMessage({
  mediaIds,
  messageId,
}: {
  mediaIds: string[]
  messageId: string
}) {
  const { data, error } = await supabaseAdmin
    .from("media")
    .update({
      message_id: messageId,
    })
    .in("id", mediaIds)
    .select("id, message_id")

  if (error) throw error
  return data ?? []
}

export async function findMessageMediaRowsByMessageId(
  messageId: string
): Promise<MessageMediaRow[]> {
  const { data, error } = await supabaseAdmin
    .from("media")
    .select("id, message_id, storage_path, mime_type")
    .eq("message_id", messageId)
    .order("created_at", { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function findMessageMediaRowsByMessageIds(
  messageIds: string[]
): Promise<MessageMediaRow[]> {
  const { data, error } = await supabaseAdmin
    .from("media")
    .select("id, message_id, storage_path, mime_type")
    .in("message_id", messageIds)
    .order("created_at", { ascending: true })

  if (error) throw error
  return data ?? []
}

/**
 * 기존 getSecureMessageMedia behavior 유지용
 * (error throw 안하고 빈 배열 반환)
 */
export async function findMessageMediaRowsByMessageIdOrEmpty(
  messageId: string
): Promise<MessageMediaRow[]> {
  const { data } = await supabaseAdmin
    .from("media")
    .select("id, message_id, storage_path, mime_type")
    .eq("message_id", messageId)

  return data ?? []
}