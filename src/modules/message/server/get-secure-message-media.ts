import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { getConversationVisibility } from "@/modules/message/server/get-conversation-visibility"

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

  const visibility = await getConversationVisibility({
    conversationId: message.conversation_id,
    userId,
  })

  if (!visibility.isVisible) {
    throw new Error("Unauthorized")
  }

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