export type MessageId = string
export type MessageUserId = string

export type Message = {
  id: MessageId
  senderUserId: MessageUserId
  receiverUserId: MessageUserId
  text: string
  price: number | null
  createdAt: string
}