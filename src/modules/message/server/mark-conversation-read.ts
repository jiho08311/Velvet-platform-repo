import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type MarkConversationReadParams = {
  conversationId: string
  userId: string
}

export async function markConversationRead({
  conversationId: _conversationId,
  userId: _userId,
}: MarkConversationReadParams): Promise<void> {
  const supabase = await createSupabaseServerClient()

  // 스키마에 last_read_at 없음 → no-op
  return
}