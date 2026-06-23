import { NextResponse } from "next/server"
import { getCurrentUser } from "@/modules/auth/public/get-current-user"
import { markStoryReadState } from "@/modules/story/public/story-read-state"
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

  const user = await getCurrentUser()

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
