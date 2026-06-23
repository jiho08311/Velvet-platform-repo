// src/modules/media/repositories/message-media-binding-repository.ts

import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type MessageMediaBindingRow = {
  binding_id: string
  message_id: string
  media_id: string
  binding_role: string
  created_at: string
}

export async function createMessageMediaBinding(input: {
  messageId: string
  mediaId: string
  bindingRole?: string
}): Promise<MessageMediaBindingRow> {
  const { data, error } = await supabaseAdmin
    .from("message_media_bindings")
   .upsert(
  {
    message_id: input.messageId,
    media_id: input.mediaId,
    binding_role: input.bindingRole ?? "attachment",
  },
  { onConflict: "message_id,media_id,binding_role" }
)
    .select("*")
    .single<MessageMediaBindingRow>()

  if (error || !data) {
    throw error ?? new Error("Failed to create message media binding")
  }

  return data
}

export async function findMessageMediaBindingsByMessageIds(
  messageIds: string[]
): Promise<MessageMediaBindingRow[]> {
  if (messageIds.length === 0) {
    return []
  }

const { data, error } = await supabaseAdmin
  .from("message_media_bindings")
  .select("*")
  .in("message_id", messageIds)
  .order("created_at", { ascending: true })
  .returns<MessageMediaBindingRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function deleteMessageMediaBinding(input: {
  messageId: string
  mediaId: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("message_media_bindings")
    .delete()
    .eq("message_id", input.messageId)
    .eq("media_id", input.mediaId)

  if (error) {
    throw error
  }
}