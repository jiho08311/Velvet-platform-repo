import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { createNotification } from "@/modules/notification/server/create-notification"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{
    postId: string
  }>
}

type PostOwnerRow = {
  id: string
  creator_id: string
}

type CreatorRow = {
  id: string
  user_id: string
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  const { postId } = await context.params

  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const content =
    typeof body?.content === "string" ? body.content.trim() : ""

  if (!postId) {
    return NextResponse.json({ error: "Post id is required" }, { status: 400 })
  }

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 })
  }

  // 🔥 여기로 이동
  const { default: OpenAI } = await import("openai")

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const moderation = await openai.moderations.create({
    model: "omni-moderation-latest",
    input: content,
  })

  const flagged = moderation.results[0]?.flagged ?? false

  if (flagged) {
    return NextResponse.json(
      { error: "Comment violates policy" },
      { status: 400 }
    )
  }

  const { data: insertedComment, error: insertError } = await supabaseAdmin
    .from("comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
    })
    .select("id, post_id, user_id, content, created_at")
    .single()

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    )
  }

  const { data: post } = await supabaseAdmin
    .from("posts")
    .select("id, creator_id")
    .eq("id", postId)
    .single<PostOwnerRow>()

  if (post?.creator_id) {
    const { data: creator } = await supabaseAdmin
      .from("creators")
      .select("id, user_id")
      .eq("id", post.creator_id)
      .single<CreatorRow>()

    if (creator?.user_id && creator.user_id !== user.id) {
      await createNotification({
        userId: creator.user_id,
        type: "comment_created",
        title: "New comment",
        body: "Someone commented on your post",
        data: {
          postId,
          commentId: insertedComment.id,
          creatorId: post.creator_id,
        },
      })
    }
  }

  return NextResponse.json({
    ok: true,
    item: insertedComment,
  })
}