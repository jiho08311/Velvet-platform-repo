export type MessageId = string
export type MessageUserId = string

export type Message = {
  id: MessageId
  senderUserId: MessageUserId
  conversationId: string
  text: string
  price: number | null
  type: string
  status: string
  createdAt: string
  readAt: string | null
}