import { resolveMessageMedia } from "@/modules/media/public/resolve-message-media"
import type { ConversationMessageMedia } from "@/modules/message/types"

export type MessageMediaRow = {
  id: string
  message_id: string | null
  storage_path: string
  mime_type: string
}

export async function createConversationMessageMedia(
  media: MessageMediaRow,
  input: {
    viewerUserId: string
    senderUserId: string
  }
): Promise<ConversationMessageMedia> {
  return resolveMessageMedia({
    mediaId: media.id,
    storagePath: media.storage_path,
    mimeType: media.mime_type,
    viewerUserId: input.viewerUserId,
    senderUserId: input.senderUserId,
  })
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