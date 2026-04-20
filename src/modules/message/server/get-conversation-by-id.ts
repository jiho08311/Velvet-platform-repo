import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { resolveConversationParticipants } from "@/modules/message/server/resolve-conversation-participants"
import { getConversationVisibility } from "@/modules/message/server/get-conversation-visibility"

type GetConversationByIdInput = {
  conversationId: string
  userId: string
}

type ConversationRow = {
  id: string
  created_at: string
  updated_at: string
  last_message_at: string | null
}

type ProfileRow = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

type CreatorRow = {
  id: string
  user_id: string
}

export async function getConversationById({
  conversationId,
  userId,
}: GetConversationByIdInput) {
  const supabase = await createSupabaseServerClient()

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, created_at, updated_at, last_message_at")
    .eq("id", conversationId)
    .maybeSingle<ConversationRow>()

  if (conversationError) {
    throw conversationError
  }

  if (!conversation) {
    return null
  }

  const visibility = await getConversationVisibility({
    conversationId,
    userId,
  })

  if (!visibility.isVisible) {
    return null
  }

  const { otherUserId } = await resolveConversationParticipants({
    conversationId,
    userId,
  })

  let participant = null

  if (otherUserId) {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", otherUserId)
      .maybeSingle<ProfileRow>()

    if (profileError) {
      throw profileError
    }

    if (profile) {
      participant = {
        userId: profile.id,
        username: profile.username,
        displayName: profile.display_name ?? profile.username,
        avatarUrl: profile.avatar_url,
      }
    } else {
      const { data: creator, error: creatorError } = await supabaseAdmin
        .from("creators")
        .select("id, user_id")
        .eq("user_id", otherUserId)
        .maybeSingle<CreatorRow>()

      if (creatorError) {
        throw creatorError
      }

      if (creator) {
        const { data: creatorProfile, error: creatorProfileError } =
          await supabaseAdmin
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .eq("id", creator.user_id)
            .maybeSingle<ProfileRow>()

        if (creatorProfileError) {
          throw creatorProfileError
        }

        participant = creatorProfile
          ? {
              userId: creatorProfile.id,
              username: creatorProfile.username,
              displayName:
                creatorProfile.display_name ?? creatorProfile.username,
              avatarUrl: creatorProfile.avatar_url,
            }
          : null
      }
    }
  }

  return {
    id: conversation.id,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    lastMessageAt: conversation.last_message_at,
    participant,
  }
}