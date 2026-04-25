import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import {
  buildStoryVideoJobPollResponse,
  pickStoryVideoJobPollRow,
} from "@/modules/media/lib/story-video-job-contract"
import { enqueueStoryVideoJob } from "@/modules/media/server/story-video-job.service"
import {
  parseStoryVideoJobFormData,
  StoryPayloadValidationError,
} from "@/modules/story/lib/story-create-payload"

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

    const { file, expiresAt, story } = parseStoryVideoJobFormData(
      await request.formData()
    )

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Video file only" }, { status: 400 })
    }

    const job = await enqueueStoryVideoJob({
      userId: user.id,
      file,
      story,
      expiresAt,
    })

    return NextResponse.json(
      buildStoryVideoJobPollResponse(pickStoryVideoJobPollRow(job))
    )
  } catch (error) {
    if (error instanceof StoryPayloadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const message =
      error instanceof Error ? error.message : "Failed to enqueue job"

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
