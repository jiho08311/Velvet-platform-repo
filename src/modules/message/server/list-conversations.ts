import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type ConversationRow = {
  id: string
  created_at: string
  updated_at: string
  last_message_at: string | null
}

type ConversationParticipantRow = {
  conversation_id: string
  user_id: string
}

type ProfileRow = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

type MessageRow = {
  id: string
  conversation_id: string
  content: string
  created_at: string
}

export type Conversation = {
  id: string
  createdAt: string
  updatedAt: string
  lastMessageAt: string | null
  participant: {
    userId: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
  lastMessage: {
    id: string
    content: string
    createdAt: string
  } | null
}

type ListConversationsParams = {
  userId: string
}

export async function listConversations({
  userId,
}: ListConversationsParams): Promise<Conversation[]> {
  const supabase = await createSupabaseServerClient()

  const { data: participantRows, error: participantError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .eq("user_id", userId)

  if (participantError) {
    throw participantError
  }

  const conversationIds = Array.from(
    new Set((participantRows ?? []).map((row) => row.conversation_id))
  )

  if (conversationIds.length === 0) {
    return []
  }

  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("id, created_at, updated_at, last_message_at")
    .in("id", conversationIds)
    .order("last_message_at", { ascending: false })

  if (conversationsError) {
    throw conversationsError
  }

  const { data: allParticipantRows, error: allParticipantsError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .in("conversation_id", conversationIds)

  if (allParticipantsError) {
    throw allParticipantsError
  }

  const otherParticipantMap = new Map<string, string>()

  for (const row of (allParticipantRows ?? []) as ConversationParticipantRow[]) {
    if (row.user_id !== userId && !otherParticipantMap.has(row.conversation_id)) {
      otherParticipantMap.set(row.conversation_id, row.user_id)
    }
  }

  const participantIds = Array.from(new Set(otherParticipantMap.values()))

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", participantIds)

  if (profilesError) {
    throw profilesError
  }

  const profileMap = new Map(
    ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile])
  )

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, conversation_id, content, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false })

  if (messagesError) {
    throw messagesError
  }

  const lastMessageMap = new Map<string, MessageRow>()

  for (const message of (messages ?? []) as MessageRow[]) {
    if (!lastMessageMap.has(message.conversation_id)) {
      lastMessageMap.set(message.conversation_id, message)
    }
  }

  return ((conversations ?? []) as ConversationRow[]).map((row) => {
    const participantUserId = otherParticipantMap.get(row.id) ?? ""
    const profile = profileMap.get(participantUserId)
    const lastMessage = lastMessageMap.get(row.id)

    return {
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastMessageAt: row.last_message_at,
      participant: {
        userId: participantUserId,
        username: profile?.username ?? "",
        displayName: profile?.display_name ?? profile?.username ?? "",
        avatarUrl: profile?.avatar_url ?? null,
      },
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            content: lastMessage.content,
            createdAt: lastMessage.created_at,
          }
        : null,
    }
  })
}