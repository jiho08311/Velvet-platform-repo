import { NextResponse } from "next/server"
import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import {
  parseStoryCreateRequestBody,
  StoryPayloadValidationError,
} from "@/modules/story/lib/story-create-payload"
import { createStory } from "@/modules/story/server/create-story"

type CreateStoryRouteBody = {
  storagePath?: unknown
  text?: unknown
  visibility?: unknown
  editorState?: unknown
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const creator = await getCreatorByUserId(user.id)

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    const body = (await request.json()) as CreateStoryRouteBody
    const payload = parseStoryCreateRequestBody(body)

    await createStory({
      creatorId: creator.id,
      storagePath: payload.storagePath,
      story: payload.story,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof StoryPayloadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const message =
      error instanceof Error ? error.message : "Failed to create story"

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
