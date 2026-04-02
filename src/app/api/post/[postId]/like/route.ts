import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { createNotification } from "@/modules/notification/server/create-notification"

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

  if (!postId) {
    return NextResponse.json({ error: "Post id is required" }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from("post_likes")
    .insert({
      post_id: postId,
      user_id: user.id,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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
        type: "post_liked",
        title: "Post liked",
        body: "Someone liked your post",
        data: {
          postId,
          creatorId: post.creator_id,
        },
      })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
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

  if (!postId) {
    return NextResponse.json({ error: "Post id is required" }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}