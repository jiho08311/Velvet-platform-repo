import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"

type MediaRow = {
  id: string
  message_id: string
  storage_path: string
  mime_type: string
}

function getMediaType(mimeType: string): "image" | "video" {
  return mimeType.startsWith("video/") ? "video" : "image"
}

export async function getSecureMessageMedia({
  messageId,
  userId,
}: {
  messageId: string
  userId: string
}) {
  const supabase = await createSupabaseServerClient()

  const { data: message } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, type")
    .eq("id", messageId)
    .maybeSingle()

  if (!message) return []

  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", message.conversation_id)

  const isParticipant = (participants ?? []).some(
    (p) => p.user_id === userId
  )

  if (!isParticipant) throw new Error("Unauthorized")

  let canAccess = true

  if (message.type === "ppv" && message.sender_id !== userId) {
    const { data: payment } = await supabase
      .from("payments")
      .select("id")
      .eq("user_id", userId)
      .eq("target_type", "message")
      .eq("target_id", messageId)
      .eq("status", "succeeded")
      .maybeSingle()

    if (!payment) canAccess = false
  }

  if (!canAccess) return []

  const { data: mediaRows } = await supabase
    .from("media")
    .select("id, message_id, storage_path, mime_type")
    .eq("message_id", messageId)

  return Promise.all(
    (mediaRows ?? []).map(async (media: MediaRow) => {
      const url = await createMediaSignedUrl({
        storagePath: media.storage_path,
        viewerUserId: userId,
        creatorUserId: message.sender_id,
        visibility: "paid",
        hasPurchased: true,
      })

      return {
        id: media.id,
        url,
        type: getMediaType(media.mime_type),
        mimeType: media.mime_type,
      }
    })
  )
}