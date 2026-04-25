import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import {
  normalizeConversationParticipantIdentity,
  type ConversationParticipantIdentity,
} from "@/modules/message/types"

type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

type GetConversationParticipantIdentityParams = {
  userId: string | null
}

export async function getConversationParticipantIdentity({
  userId,
}: GetConversationParticipantIdentityParams): Promise<ConversationParticipantIdentity | null> {
  if (!userId) {
    return null
  }

  const supabase = await createSupabaseServerClient()
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle<ProfileRow>()

  if (error) {
    throw error
  }

  return normalizeConversationParticipantIdentity(profile)
}
