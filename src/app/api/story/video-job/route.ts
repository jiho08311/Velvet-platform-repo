import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { enqueueStoryVideoJob } from "@/modules/media/server/story-video-job.service"
import type { StoryEditorState } from "@/modules/story/types"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() {},
          remove() {},
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const visibility = String(formData.get("visibility") ?? "subscribers")
    const startTime = Number(formData.get("startTime") ?? "0")
    const expiresAt = String(
      formData.get("expiresAt") ??
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    )

    const rawEditorState = formData.get("editorState")
    let editorState: StoryEditorState | null = null

    if (typeof rawEditorState === "string" && rawEditorState.trim()) {
      try {
        editorState = JSON.parse(rawEditorState) as StoryEditorState
      } catch {
        return NextResponse.json(
          { error: "Invalid editorState" },
          { status: 400 }
        )
      }
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Video file only" }, { status: 400 })
    }

    const job = await enqueueStoryVideoJob({
      userId: user.id,
      file,
      visibility,
      startTime,
      expiresAt,
      editorState,
    })

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to enqueue job"

    return NextResponse.json({ error: message }, { status: 500 })
  }
}