import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { buildPostRenderInput } from "@/modules/post/ui/post-render-input"
import type { PostBlockEditorState } from "../types"

export type CreatorStudioPost = {
  id: string
  creatorId: string
  title: string | null
  content: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

type ListCreatorStudioPostsParams = {
  creatorId: string
}

type PostBlockRow = {
  id: string
  post_id: string
  type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  media_id: string | null
  sort_order: number
  created_at: string
  editor_state: PostBlockEditorState | null
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
    .in("status", ["draft", "scheduled", "published", "archived"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  const posts = data ?? []

  if (posts.length === 0) {
    return []
  }

  const postIds = posts.map((post) => post.id)

  const { data: blockRows, error: blockRowsError } = await supabaseAdmin
    .from("post_blocks")
    .select("id, post_id, type, content, media_id, sort_order, created_at, editor_state")
    .in("post_id", postIds)
    .order("sort_order", { ascending: true })
    .returns<PostBlockRow[]>()

  if (blockRowsError) {
    throw blockRowsError
  }

  const blocksMap = new Map<string, PostBlockRow[]>()

  for (const block of blockRows ?? []) {
    const current = blocksMap.get(block.post_id) ?? []
    current.push(block)
    blocksMap.set(block.post_id, current)
  }

  return posts.map((post) => {
    const renderInput = buildPostRenderInput({
      text: post.content ?? "",
      blocks: (blocksMap.get(post.id) ?? []).map((block) => ({
        id: block.id,
        postId: block.post_id,
        type: block.type,
        content: block.content,
        mediaId: block.media_id,
        sortOrder: block.sort_order,
        createdAt: block.created_at,
        editorState: block.editor_state ?? null,
      })),
      media: [],
    })

    return {
      id: post.id,
      creatorId: post.creator_id,
      title: post.title,
      content: renderInput.blockText || null,
      status: post.status,
      visibility: post.visibility,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      deletedAt: post.deleted_at,
    }
  })
}