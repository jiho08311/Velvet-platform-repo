import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { resolveConversationParticipants } from "@/modules/message/server/resolve-conversation-participants"

type ProfileRow = {
  id: string
  is_deactivated: boolean | null
}

type GetConversationVisibilityParams = {
  conversationId: string
  userId: string
}

export type ConversationVisibility = {
  isVisible: boolean
  isParticipant: boolean
  otherUserId: string | null
}

export async function getConversationVisibility({
  conversationId,
  userId,
}: GetConversationVisibilityParams): Promise<ConversationVisibility> {
  const { isParticipant, otherUserId } = await resolveConversationParticipants({
    conversationId,
    userId,
  })

  if (!isParticipant) {
    return {
      isVisible: false,
      isParticipant: false,
      otherUserId,
    }
  }

  if (!otherUserId) {
    return {
      isVisible: false,
      isParticipant: true,
      otherUserId: null,
    }
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id, is_deactivated")
    .eq("id", otherUserId)
    .maybeSingle<ProfileRow>()

  if (error) {
    throw error
  }

  if (!profile || profile.is_deactivated) {
    return {
      isVisible: false,
      isParticipant: true,
      otherUserId,
    }
  }

  return {
    isVisible: true,
    isParticipant: true,
    otherUserId,
  }
}