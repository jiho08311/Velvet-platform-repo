import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type ThreadMessage = {
  id: string
  threadId: string
  senderUserId: string
  content: string
  createdAt: string
}

export type GetThreadMessagesInput = {
  threadId: string
  viewerUserId: string
  limit?: number
  cursor?: string | null
}

export type GetThreadMessagesResult = {
  items: ThreadMessage[]
  nextCursor: string | null
}

type MessageRow = {
  id: string
  thread_id: string
  sender_user_id: string
  content: string
  created_at: string
}

export async function getThreadMessages(
  input: GetThreadMessagesInput
): Promise<GetThreadMessagesResult> {
  const threadId = input.threadId.trim()
  const viewerUserId = input.viewerUserId.trim()

  if (!threadId) {
    throw new Error("Thread id is required")
  }

  if (!viewerUserId) {
    throw new Error("Viewer user id is required")
  }

  const limit = Math.max(1, Math.min(input.limit ?? 20, 100))

  let query = supabaseAdmin
    .from("messages")
    .select("id, thread_id, sender_user_id, content, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (input.cursor) {
    query = query.lt("created_at", input.cursor)
  }

  const { data, error } = await query.returns<MessageRow[]>()

  if (error) {
    throw error
  }

  const rows = data ?? []

  const items: ThreadMessage[] = rows.map((row) => ({
    id: row.id,
    threadId: row.thread_id,
    senderUserId: row.sender_user_id,
    content: row.content,
    createdAt: row.created_at,
  }))

  const nextCursor =
    items.length === limit ? items[items.length - 1]?.createdAt ?? null : null

  return {
    items,
    nextCursor,
  }
}