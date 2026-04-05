import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"

type ListMessagesParams = {
  conversationId: string
  userId: string
}

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  type: string | null
  price: number | null
}

type MediaRow = {
  id: string
  message_id: string
  storage_path: string
  mime_type: string
}

type MessageMedia = {
  id: string
  url: string
  type: "image" | "video"
  mimeType: string
}

export type Message = {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  type: "text"
  price: null
  isLocked: false
  media: MessageMedia[]
}

function getMediaType(mimeType: string): "image" | "video" {
  return mimeType.startsWith("video/") ? "video" : "image"
}

export async function listMessages({
  conversationId,
  userId,
}: ListMessagesParams): Promise<Message[]> {
  const supabase = await createSupabaseServerClient()

  const { data: participants, error: participantError } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)

  if (participantError) {
    throw participantError
  }

  const isParticipant = (participants ?? []).some(
    (p) => p.user_id === userId
  )

  if (!isParticipant) {
    throw new Error("Unauthorized")
  }

  const { data: messagesData, error: messagesError } = await supabase
    .from("messages")
    .select(
      "id, conversation_id, sender_id, content, created_at, type, price"
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (messagesError) {
    throw messagesError
  }

  const messageRows = (messagesData ?? []) as MessageRow[]
  const messageIds = messageRows.map((message) => message.id)

  let mediaRows: MediaRow[] = []

  if (messageIds.length > 0) {
    const { data: mediaData, error: mediaError } = await supabase
      .from("media")
      .select("id, message_id, storage_path, mime_type")
      .in("message_id", messageIds)
      .order("created_at", { ascending: true })

    if (mediaError) {
      throw mediaError
    }

    mediaRows = (mediaData ?? []) as MediaRow[]
  }

  const signedMediaEntries = await Promise.all(
    mediaRows.map(async (media) => {
      const url = await createMediaSignedUrl({
        storagePath: media.storage_path,
        viewerUserId: userId,
        creatorUserId: userId,
        visibility: "paid",
        hasPurchased: true,
      })

      return {
        ...media,
        signedUrl: url,
      }
    })
  )

  const mediaMap = new Map<string, MessageMedia[]>()

  for (const media of signedMediaEntries) {
    const current = mediaMap.get(media.message_id) ?? []

    current.push({
      id: media.id,
      url: media.signedUrl,
      type: getMediaType(media.mime_type),
      mimeType: media.mime_type,
    })

    mediaMap.set(media.message_id, current)
  }

  return messageRows.map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
    type: "text",
    price: null,
    isLocked: false,
    media: mediaMap.get(row.id) ?? [],
  }))
}