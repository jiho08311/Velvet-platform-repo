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

export type ConversationMessageMedia = {
  id: string
  url: string
  type: "image" | "video"
  mimeType: string
}

export type ConversationMessageItem = {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  readAt: string | null
  status: string | null

  /**
   * Message render category only.
   *
   * This field tells the message UI whether the message should be treated as a
   * normal text message or a PPV-shaped message for display purposes.
   *
   * Do not treat this as the purchase state, unlock state, or media access
   * source of truth.
   */
  type: "text" | "ppv"

  /**
   * Commerce display/input field only.
   *
   * This value may describe the intended PPV price, but it does not prove that
   * the message is purchasable, purchased, unlocked, or accessible.
   */
  price: number | null

  /**
   * Current display-only lock hint.
   *
   * Existing behavior derives this from the message row shape. It must not be
   * expanded into the final PPV unlock, purchase, paid access, or signed URL
   * authorization source of truth.
   *
   * PPV message unlock / purchase source of truth: unknown / unsupported.
   */
  isLocked: boolean

  media: ConversationMessageMedia[]
}

export type ConversationMessageListItem = ConversationMessageItem & {
  isOwn: boolean
  reportPathname?: string
}

export type SendMessagePayload = {
  conversationId: string
  content: string
  type: "text"
  mediaIds: string[]
}

export type SendMessageResult = {
  message: ConversationMessageItem
}

export type MessageSentEvent = {
  type: "message.sent"
  messageId: string
  conversationId: string
  senderId: string
  recipientUserId: string
}

export type SendMessageOutput = {
  message: ConversationMessageItem
  messageSentEvent: MessageSentEvent
}

type ConversationMessageRowInput = {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  created_at: string
  read_at: string | null
  status: string | null
  type: string | null
  price: number | null
}

export function compareConversationMessageOrder(
  left: Pick<ConversationMessageItem, "createdAt" | "id">,
  right: Pick<ConversationMessageItem, "createdAt" | "id">
) {
  const createdAtComparison =
    new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()

  if (createdAtComparison !== 0) {
    return createdAtComparison
  }

  return left.id.localeCompare(right.id)
}

export function normalizeConversationMessageItem(
  row: ConversationMessageRowInput,
  media: ConversationMessageMedia[]
): ConversationMessageItem {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content ?? "",
    createdAt: row.created_at,
    readAt: row.read_at,
    status: row.status,
    type: row.type === "ppv" ? "ppv" : "text",
    price: row.price,

    /**
     * Row-derived display state only.
     *
     * This preserves the existing assumption that ppv messages are represented
     * as locked in the message view model.
     *
     * Do not treat this as the final media access policy, purchase state, or
     * signed URL authorization source of truth.
     *
     * Final paid/purchased/locked media access policy: unknown.
     */
    isLocked: row.type === "ppv",

    media,
  }
}

export function normalizeSendMessagePayload(input: {
  conversationId?: unknown
  content?: unknown
  type?: unknown
  mediaIds?: unknown
}): SendMessagePayload {
  return {
    conversationId:
      typeof input.conversationId === "string" ? input.conversationId : "",
    content: typeof input.content === "string" ? input.content : "",
    type: input.type === "text" ? "text" : "text",
    mediaIds: Array.isArray(input.mediaIds)
      ? input.mediaIds.filter((value): value is string => typeof value === "string")
      : [],
  }
}

export function createSendMessageResult(
  message: ConversationMessageItem
): SendMessageResult {
  return { message }
}

export function createMessageSentEvent({
  messageId,
  conversationId,
  senderId,
  recipientUserId,
}: {
  messageId: string
  conversationId: string
  senderId: string
  recipientUserId: string
}): MessageSentEvent {
  return {
    type: "message.sent",
    messageId,
    conversationId,
    senderId,
    recipientUserId,
  }
}

export function createSendMessageOutput({
  message,
  messageSentEvent,
}: SendMessageOutput): SendMessageOutput {
  return {
    message,
    messageSentEvent,
  }
}

export function toConversationMessageListItem({
  message,
  currentUserId,
  reportPathname,
}: {
  message: ConversationMessageItem
  currentUserId: string
  reportPathname?: string
}): ConversationMessageListItem {
  return {
    ...message,
    isOwn: message.senderId === currentUserId,
    reportPathname,
  }
}

export function mergeConversationMessageListItems({
  currentMessages,
  nextMessage,
}: {
  currentMessages: ConversationMessageListItem[]
  nextMessage: ConversationMessageListItem
}): ConversationMessageListItem[] {
  const nextMessages = currentMessages.filter(
    (message) => message.id !== nextMessage.id
  )

  nextMessages.push(nextMessage)
  nextMessages.sort(compareConversationMessageOrder)

  return nextMessages
}

export type ConversationParticipantIdentity = {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
}

export type ConversationSummaryLastMessage = {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  type: "text" | "ppv"
}

type ConversationSummaryLastMessageRowInput = {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  created_at: string
  type: string | null
}

export function normalizeConversationSummaryLastMessage(
  row: ConversationSummaryLastMessageRowInput
): ConversationSummaryLastMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content ?? "",
    createdAt: row.created_at,
    type: row.type === "ppv" ? "ppv" : "text",
  }
}
export type ConversationSummary = {
  id: string
  createdAt: string

  /**
   * Conversation row update timestamp.
   *
   * Used only as the display fallback when the conversation has no
   * preview lastMessage.
   */
  updatedAt: string

  /**
   * List ordering timestamp.
   *
   * This is the source of truth for conversation list sorting.
   * Do not use this for rendering the visible timestamp.
   */
  lastMessageAt: string | null

  participant: ConversationParticipantIdentity | null

  /**
   * List preview only.
   *
   * listConversations() may populate this for /messages preview.
   * Use lastMessage.createdAt as the primary display timestamp.
   * If this is null, fall back to ConversationSummary.updatedAt.
   *
   * getConversationById() currently returns null for detail compatibility.
   * Do not use this as the source of truth for message thread content.
   */
  lastMessage: ConversationSummaryLastMessage | null
}

export type ConversationSummaryViewModel = ConversationSummary

export type MessageThreadViewModel = {
  conversationId: string
  currentUserId: string
  reportPathname: string
  messages: ConversationMessageListItem[]
}

type ConversationParticipantProfile = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

export function normalizeConversationParticipantIdentity(
  profile: ConversationParticipantProfile | null
): ConversationParticipantIdentity | null {
  if (!profile) {
    return null
  }

  return {
    userId: profile.id,
    username: profile.username ?? "",
    displayName: profile.display_name ?? profile.username ?? "",
    avatarUrl: profile.avatar_url,
  }
}