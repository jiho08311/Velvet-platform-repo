import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { markStoryReadState } from "@/modules/story/server/story-read-state"
import type {
  StoryReadStateApiRequest,
  StoryReadStateApiResponse,
} from "@/modules/story/types"

export async function POST(req: Request) {
  let body: unknown

  try {
    body = await req.json()
  } catch {
    return NextResponse.json<StoryReadStateApiResponse>(
      { ok: false, reason: "invalid_request" },
      { status: 400 }
    )
  }

  const payload = body as Partial<StoryReadStateApiRequest>
  const creatorId =
    typeof payload.creatorId === "string" ? payload.creatorId.trim() : ""
  const storyId =
    typeof payload.storyId === "string" ? payload.storyId.trim() : ""

  if (!creatorId || !storyId) {
    return NextResponse.json<StoryReadStateApiResponse>(
      { ok: false, reason: "invalid_request" },
      { status: 400 }
    )
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json<StoryReadStateApiResponse>(
      { ok: false, reason: "unauthorized" },
      { status: 401 }
    )
  }

  const result = await markStoryReadState({
    viewerUserId: user.id,
    creatorId,
    lastSeenStoryId: storyId,
  })

  if (!result.ok) {
    return NextResponse.json<StoryReadStateApiResponse>(
      {
        ok: false,
        reason: result.reason,
      },
      { status: 403 }
    )
  }

  return NextResponse.json<StoryReadStateApiResponse>({
    ok: true,
    creatorId: result.creatorId,
    persistedStoryId: result.persistedStoryId,
  })
}
