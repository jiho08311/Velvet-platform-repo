import { NextResponse } from "next/server"
import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { createStory } from "@/modules/story/server/create-story"
import type { StoryEditorState } from "@/modules/story/types"

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

  
  const body = await request.json()

const isVideo =
  typeof body.storagePath === "string" &&
  (body.storagePath.endsWith(".mp4") ||
    body.storagePath.endsWith(".mov") ||
    body.storagePath.endsWith(".webm"))

if (isVideo) {
  // 👉 video는 enqueue로 보내야 함
  return NextResponse.json(
    { error: "Use /api/story/video for video upload" },
    { status: 400 }
  )
}

await createStory({
  creatorId: creator.id,
  storagePath: body.storagePath,
  text: typeof body.text === "string" ? body.text : null,
  visibility: body.visibility,
  editorState: body.editorState ?? null,
})

return NextResponse.json({ success: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create story"

    return NextResponse.json({ error: message }, { status: 500 })
  }
}