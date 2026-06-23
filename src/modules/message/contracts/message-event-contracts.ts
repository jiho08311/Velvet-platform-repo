export type MessageSentEventContract = {
  type: "message.sent"
  messageId: string
  conversationId: string
  senderId: string
  recipientUserId: string
}