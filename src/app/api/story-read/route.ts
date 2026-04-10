import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { markStoryReadState } from "@/modules/story/server/story-read-state"

export async function POST(req: Request) {
  const body = await req.json()

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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await markStoryReadState({
    viewerUserId: user.id,
    creatorId: body.creatorId,
    lastSeenStoryId: body.storyId,
  })

  return NextResponse.json({ ok: true })
}