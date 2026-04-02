import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type RouteContext = {
  params: Promise<{
    commentId: string
  }>
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const { commentId } = await context.params

  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!commentId) {
    return NextResponse.json({ error: "Comment id is required" }, { status: 400 })
  }

  const { data: comment, error: commentError } = await supabaseAdmin
    .from("comments")
    .select("id, user_id")
    .eq("id", commentId)
    .is("deleted_at", null)
    .single()

  if (commentError || !comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 })
  }

  if (comment.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { error: deleteError } = await supabaseAdmin
    .from("comments")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", commentId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}