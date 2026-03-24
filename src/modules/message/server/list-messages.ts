import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type ListMessagesParams = {
  conversationId: string
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

export type Message = {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  type: "text" | "ppv"
  price: number | null
  isLocked: boolean
}

export async function listMessages({
  conversationId,
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

  const ppvMessageIds = messageRows
    .filter((message) => message.type === "ppv")
    .map((message) => message.id)

  let purchasedSet = new Set<string>()

  if (ppvMessageIds.length > 0) {
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("target_id")
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

  return messageRows.map((row) => {
    const type = (row.type as "text" | "ppv") ?? "text"
    const isPurchased = purchasedSet.has(row.id)

    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      content: row.content,
      createdAt: row.created_at,
      type,
      price: row.price,
      isLocked: type === "ppv" && !isPurchased,
    }
  })
}