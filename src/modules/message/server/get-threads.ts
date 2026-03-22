import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type MessageThread = {
  id: string
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
  updatedAt: string
}

export type GetThreadsInput = {
  viewerUserId: string
  limit?: number
  cursor?: string | null
}

export type GetThreadsResult = {
  items: MessageThread[]
  nextCursor: string | null
}

type ThreadRow = {
  id: string
  user_a: string
  user_b: string
  updated_at: string
}

type MessageRow = {
  id: string
  thread_id: string
  content: string
  created_at: string
}

type ProfileRow = {
  user_id: string
  username: string
  display_name: string
  avatar_url: string | null
}

export async function getThreads(
  input: GetThreadsInput
): Promise<GetThreadsResult> {
  const viewerUserId = input.viewerUserId.trim()

  if (!viewerUserId) {
    throw new Error("Viewer user id is required")
  }

  const limit = Math.max(1, Math.min(input.limit ?? 20, 100))

  let query = supabaseAdmin
    .from("threads")
    .select("id, user_a, user_b, updated_at")
    .or(`user_a.eq.${viewerUserId},user_b.eq.${viewerUserId}`)
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (input.cursor) {
    query = query.lt("updated_at", input.cursor)
  }

  const { data: threads, error: threadsError } = await query.returns<
    ThreadRow[]
  >()

  if (threadsError) {
    throw threadsError
  }

  const threadRows = threads ?? []

  if (threadRows.length === 0) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const threadIds = threadRows.map((t) => t.id)

  const { data: messages } = await supabaseAdmin
    .from("messages")
    .select("id, thread_id, content, created_at")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: false })
    .returns<MessageRow[]>()

  const lastMessageMap = new Map<string, MessageRow>()

  for (const msg of messages ?? []) {
    if (!lastMessageMap.has(msg.thread_id)) {
      lastMessageMap.set(msg.thread_id, msg)
    }
  }

  const participantIds = threadRows.map((t) =>
    t.user_a === viewerUserId ? t.user_b : t.user_a
  )

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("user_id, username, display_name, avatar_url")
    .in("user_id", participantIds)
    .returns<ProfileRow[]>()

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p])
  )

  const items: MessageThread[] = threadRows.map((thread) => {
    const otherUserId =
      thread.user_a === viewerUserId ? thread.user_b : thread.user_a

    const profile = profileMap.get(otherUserId)

    const last = lastMessageMap.get(thread.id)

    return {
      id: thread.id,
      participant: {
        userId: otherUserId,
        username: profile?.username ?? "",
        displayName: profile?.display_name ?? "",
        avatarUrl: profile?.avatar_url ?? null,
      },
      lastMessage: last
        ? {
            id: last.id,
            content: last.content,
            createdAt: last.created_at,
          }
        : null,
      updatedAt: thread.updated_at,
    }
  })

  const nextCursor =
    items.length === limit ? items[items.length - 1]?.updatedAt ?? null : null

  return {
    items,
    nextCursor,
  }
}