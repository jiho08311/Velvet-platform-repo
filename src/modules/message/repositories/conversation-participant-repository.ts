import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export type ConversationParticipantRow = {
  conversation_id: string
  user_id: string
}

export type ConversationParticipantProfileLifecycleState =
  | "active"
  | "deactivated"
  | "delete_pending"

export type ConversationParticipantIdentityVisibilityState =
  | "visible"
  | "not_visible"

export type ConversationParticipantProfileRow = {
  id: string
  is_deactivated: boolean | null
  profileLifecycleState: ConversationParticipantProfileLifecycleState | null
  identityVisibilityState: ConversationParticipantIdentityVisibilityState | null
}

export type ConversationParticipantIdentityProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

type CanonicalConversationItemRow = {
  conversation_id: string
  participant_user_ids: string[]
  is_conversation_visible: boolean
}

type CanonicalConversationParticipantProfileRow = {
  profile_id: string
  profile_lifecycle_state: string | null
  identity_visibility_state: string | null
}

type CanonicalConversationParticipantIdentityProfileRow = {
  profile_id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

function parseProfileLifecycleState(
  value: string | null | undefined
): ConversationParticipantProfileLifecycleState | null {
  if (
    value === "active" ||
    value === "deactivated" ||
    value === "delete_pending"
  ) {
    return value
  }

  return null
}

function parseIdentityVisibilityState(
  value: string | null | undefined
): ConversationParticipantIdentityVisibilityState | null {
  if (value === "visible" || value === "not_visible") {
    return value
  }

  return null
}

export async function listConversationParticipantRows(
  conversationId: string
): Promise<ConversationParticipantRow[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_conversation_items")
    .select("conversation_id, participant_user_ids, is_conversation_visible")
    .eq("conversation_id", conversationId)
    .eq("is_conversation_visible", true)
    .maybeSingle<CanonicalConversationItemRow>()

  if (error) {
    throw error
  }

  if (!data) return []

  return data.participant_user_ids.map((userId) => ({
    conversation_id: data.conversation_id,
    user_id: userId,
  }))
}

export async function listConversationParticipantRowsByUserId(
  userId: string
): Promise<ConversationParticipantRow[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_conversation_items")
    .select("conversation_id, participant_user_ids, is_conversation_visible")
    .contains("participant_user_ids", [userId])
    .eq("is_conversation_visible", true)

  if (error) {
    throw error
  }

  return ((data ?? []) as CanonicalConversationItemRow[]).map((row) => ({
    conversation_id: row.conversation_id,
    user_id: userId,
  }))
}

export async function findConversationParticipantProfileById(
  userId: string
): Promise<ConversationParticipantProfileRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_profiles")
    .select("profile_id, profile_lifecycle_state, identity_visibility_state")
    .eq("profile_id", userId)
    .maybeSingle<CanonicalConversationParticipantProfileRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return {
    id: data.profile_id,
    is_deactivated: null,
    profileLifecycleState: parseProfileLifecycleState(
      data.profile_lifecycle_state
    ),
    identityVisibilityState: parseIdentityVisibilityState(
      data.identity_visibility_state
    ),
  }
}

export async function findConversationParticipantIdentityProfileById(
  userId: string
): Promise<ConversationParticipantIdentityProfileRow | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_profiles")
    .select("profile_id, username, display_name, avatar_url")
    .eq("profile_id", userId)
    .maybeSingle<CanonicalConversationParticipantIdentityProfileRow>()

  if (error) {
    throw error
  }

  if (!data) return null

  return {
    id: data.profile_id,
    username: data.username,
    display_name: data.display_name,
    avatar_url: data.avatar_url,
  }
}