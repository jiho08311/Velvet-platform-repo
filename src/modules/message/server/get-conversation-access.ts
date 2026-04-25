import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type ParticipantRow = {
  conversation_id: string
  user_id: string
}

type ProfileRow = {
  id: string
  is_deactivated: boolean | null
}

type GetConversationAccessParams = {
  conversationId: string
  userId: string
}

export type ConversationAccess = {
  isParticipant: boolean
  otherUserId: string | null
  canAccess: boolean
}

export async function getConversationAccess({
  conversationId,
  userId,
}: GetConversationAccessParams): Promise<ConversationAccess> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .eq("conversation_id", conversationId)

  if (error) {
    throw error
  }

  const participantRows = (data ?? []) as ParticipantRow[]
  const participantUserIds = participantRows.map((row) => row.user_id)
  const isParticipant = participantUserIds.includes(userId)
  const otherUserId =
    participantUserIds.find((participantUserId) => participantUserId !== userId) ??
    null

  if (!isParticipant || !otherUserId) {
    return {
      isParticipant,
      otherUserId,
      canAccess: false,
    }
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, is_deactivated")
    .eq("id", otherUserId)
    .maybeSingle<ProfileRow>()

  if (profileError) {
    throw profileError
  }

  return {
    isParticipant,
    otherUserId,
    canAccess: Boolean(profile && !profile.is_deactivated),
  }
}

export async function requireConversationAccess(
  params: GetConversationAccessParams
): Promise<ConversationAccess> {
  const access = await getConversationAccess(params)

  if (!access.canAccess) {
    throw new Error("Unauthorized")
  }

  return access
}
