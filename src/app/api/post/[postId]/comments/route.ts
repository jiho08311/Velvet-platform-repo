import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type RouteContext = {
  params: Promise<{
    postId: string
  }>
}

type CommentRow = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
}

type ProfileRow = {
  id: string
  username: string | null
  avatar_url: string | null
}

type CommentLikeRow = {
  comment_id: string
  user_id: string
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  const { postId } = await context.params

  if (!postId) {
    return NextResponse.json({ error: "Post id is required" }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const currentUserId = user?.id ?? null

  const { data: comments, error: commentsError } = await supabaseAdmin
    .from("comments")
    .select("id, post_id, user_id, content, created_at")
    .eq("post_id", postId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .returns<CommentRow[]>()

  if (commentsError) {
    return NextResponse.json(
      { error: commentsError.message },
      { status: 500 }
    )
  }

  const commentIds = (comments ?? []).map((comment) => comment.id)

  const { data: likeRows, error: likeRowsError } = await supabaseAdmin
    .from("comment_likes")
    .select("comment_id, user_id")
    .in("comment_id", commentIds.length > 0 ? commentIds : ["00000000-0000-0000-0000-000000000000"])
    .returns<CommentLikeRow[]>()

  if (likeRowsError) {
    return NextResponse.json(
      { error: likeRowsError.message },
      { status: 500 }
    )
  }

  const likeCountMap = new Map<string, number>()

  for (const row of likeRows ?? []) {
    likeCountMap.set(
      row.comment_id,
      (likeCountMap.get(row.comment_id) ?? 0) + 1
    )
  }

  const likedCommentIdSet = new Set(
    currentUserId
      ? (likeRows ?? [])
          .filter((row) => row.user_id === currentUserId)
          .map((row) => row.comment_id)
      : []
  )

  const userIds = Array.from(
    new Set((comments ?? []).map((comment) => comment.user_id).filter(Boolean))
  )

  let profileMap = new Map<string, ProfileRow>()

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds)
      .returns<ProfileRow[]>()

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      )
    }

    profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  }

  const items = (comments ?? []).map((comment) => {
    const profile = profileMap.get(comment.user_id)

    return {
      ...comment,
      likes_count: likeCountMap.get(comment.id) ?? 0,
      is_liked: likedCommentIdSet.has(comment.id),
      profiles: {
        username: profile?.username ?? null,
        avatar_url: profile?.avatar_url ?? null,
      },
    }
  })

  return NextResponse.json({ items })
}