import { NextResponse } from "next/server"
import { getCurrentUser } from "@/modules/auth/public/get-current-user"
import { getStoryVideoJobForUser } from "@/modules/media/public/story-video-job"

type Context = {
  params: Promise<{
    jobId: string
  }>
}

export async function GET(_request: Request, context: Context) {
  try {
    const { jobId } = await context.params

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const job = await getStoryVideoJobForUser({
      jobId,
      userId: user.id,
    })

    return NextResponse.json(job)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get job status"

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
