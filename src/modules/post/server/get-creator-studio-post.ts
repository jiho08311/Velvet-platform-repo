import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export type CreatorStudioPostDetail = {
  id: string
  creatorId: string
  title: string | null
  content: string | null
  status: "draft" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

type GetCreatorStudioPostParams = {
  postId: string
  creatorId: string
}

type PostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  status: "draft" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export async function getCreatorStudioPost({
  postId,
  creatorId,
}: GetCreatorStudioPostParams): Promise<CreatorStudioPostDetail | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, creator_id, title, content, status, visibility, created_at, updated_at, deleted_at",
    )
    .eq("id", postId)
    .eq("creator_id", creatorId)
    .in("status", ["draft", "published", "archived"])
    .is("deleted_at", null)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  const post = data as PostRow

  return {
    id: post.id,
    creatorId: post.creator_id,
    title: post.title,
    content: post.content,
    status: post.status,
    visibility: post.visibility,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    deletedAt: post.deleted_at,
  }
}