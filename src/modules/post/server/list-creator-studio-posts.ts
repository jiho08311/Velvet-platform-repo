import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export type CreatorStudioPost = {
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

type ListCreatorStudioPostsParams = {
  creatorId: string
}

export async function listCreatorStudioPosts({
  creatorId,
}: ListCreatorStudioPostsParams): Promise<CreatorStudioPost[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, creator_id, title, content, status, visibility, created_at, updated_at, deleted_at",
    )
    .eq("creator_id", creatorId)
    .in("status", ["draft", "published", "archived"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((post) => ({
    id: post.id,
    creatorId: post.creator_id,
    title: post.title,
    content: post.content,
    status: post.status,
    visibility: post.visibility,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    deletedAt: post.deleted_at,
  }))
}