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

type PaymentRow = {
  target_id: string
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
  type: "text" | "ppv"
  price: number | null
  isLocked: boolean
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

  const ppvMessageIds = messageRows
    .filter((message) => message.type === "ppv")
    .map((message) => message.id)

  let purchasedSet = new Set<string>()

  if (ppvMessageIds.length > 0) {
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("target_id")
      .eq("user_id", userId)
      .eq("target_type", "message")
      .eq("status", "succeeded")
      .in("target_id", ppvMessageIds)

    if (paymentsError) {
      throw paymentsError
    }

    purchasedSet = new Set(
      (payments ?? []).map((payment: PaymentRow) => payment.target_id)
    )
  }

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

  return messageRows.map((row) => {
    const type = (row.type as "text" | "ppv") ?? "text"
    const isPurchased = purchasedSet.has(row.id)
    const isOwn = row.sender_id === userId

    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      content: row.content,
      createdAt: row.created_at,
      type,
      price: row.price,
      isLocked: type === "ppv" && !isPurchased && !isOwn,
      media: mediaMap.get(row.id) ?? [],
    }
  })
}