import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import type { ConversationMessageMedia } from "@/modules/message/types"

export type MessageMediaRow = {
  id: string
  message_id: string | null
  storage_path: string
  mime_type: string
}

function getMessageMediaType(mimeType: string): "image" | "video" {
  return mimeType.startsWith("video/") ? "video" : "image"
}

export async function createConversationMessageMedia(
  media: MessageMediaRow,
  input: {
    viewerUserId: string
    senderUserId: string
  }
): Promise<ConversationMessageMedia> {
  return {
    id: media.id,
    url: await createMediaSignedUrl({
      storagePath: media.storage_path,
      viewerUserId: input.viewerUserId,
      creatorUserId: input.senderUserId,
      visibility: "paid",
      hasPurchased: true,
    }),
    type: getMessageMediaType(media.mime_type),
    mimeType: media.mime_type,
  }
}

export async function createConversationMessageMediaMap({
  mediaRows,
  viewerUserId,
  senderUserIdByMessageId,
}: {
  mediaRows: MessageMediaRow[]
  viewerUserId: string
  senderUserIdByMessageId: Map<string, string>
}): Promise<Map<string, ConversationMessageMedia[]>> {
  const mediaEntries = await Promise.all(
    mediaRows.map(async (media) => {
      const messageId = media.message_id

      if (!messageId) {
        return null
      }

      const senderUserId = senderUserIdByMessageId.get(messageId)

      if (!senderUserId) {
        return null
      }

      return {
        messageId,
        media: await createConversationMessageMedia(media, {
          viewerUserId,
          senderUserId,
        }),
      }
    })
  )

  const mediaMap = new Map<string, ConversationMessageMedia[]>()

  for (const entry of mediaEntries) {
    if (!entry) {
      continue
    }

    const current = mediaMap.get(entry.messageId) ?? []
    current.push(entry.media)
    mediaMap.set(entry.messageId, current)
  }

  return mediaMap
}
