import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
export type PostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | "needs_review" | null
  created_at: string
  published_at: string | null
  deleted_at?: string | null
}

export type PostCreatorRow = {
  id: string
  user_id: string
  username: string
  display_name: string | null
  status: "active" | "pending" | "suspended" | "inactive"
  profiles: {
    id: string
    is_deactivated: boolean | null
    is_delete_pending: boolean | null
    deleted_at: string | null
    is_banned: boolean | null
  } | null
}

export type ListCreatorPostsCreatorRow = {
  id: string
  user_id: string
  status: "active" | "pending" | "suspended" | "inactive"
  profiles: {
    id: string
    is_deactivated: boolean | null
    is_delete_pending: boolean | null
    deleted_at: string | null
    is_banned: boolean | null
  } | null
}

export type ListCreatorPostsPostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  price: number
  published_at: string | null
  created_at: string
  updated_at: string
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | "needs_review" | null
  deleted_at: string | null
}

export type PostCreateCreatorRow = {
  id: string
}


export type UpdatedPostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  price: number
  published_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type CreatorStudioPostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type CreatorStudioPostDetailRow = CreatorStudioPostRow & {
  price: number | null
}

export type MyPostsCreatorRow = {
  id: string
  user_id: string
}

export type MyPostsPostRow = {
  id: string
  creator_id: string
  content: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  created_at: string
  published_at: string | null
}

export type PostMediaAccessPostRow = {
  id: string
  creator_id: string
  visibility: "public" | "subscribers" | "paid"
  price: number
  status: "draft" | "scheduled" | "published" | "archived"
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | "needs_review" | null
  published_at: string | null
  deleted_at: string | null
}

export type PostMediaCreatorRow = {
  id: string
  user_id: string
  status: "active" | "pending" | "suspended" | "inactive"
  profiles: {
    id: string
    is_deactivated: boolean | null
    is_delete_pending: boolean | null
    deleted_at: string | null
    is_banned: boolean | null
  } | null
}

export async function findPostForMediaAccess(
  postId: string
): Promise<PostMediaAccessPostRow | null> {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, visibility, price, status, visibility_status, moderation_status, published_at, deleted_at"
    )
    .eq("id", postId)
    .maybeSingle<PostMediaAccessPostRow>()

  if (error) {
    throw error
  }

  return data
}

export async function findCreatorForPostMediaAccess(
  creatorId: string
): Promise<PostMediaCreatorRow | null> {
  const { data, error } = await supabaseAdmin
    .from("creators")
    .select(`
      id,
      user_id,
      status,
      profiles!inner (
        id,
        is_deactivated,
        is_delete_pending,
        deleted_at,
        is_banned
      )
    `)
    .eq("id", creatorId)
    .maybeSingle<PostMediaCreatorRow>()

  if (error) {
    throw error
  }

  return data
}

export async function findCreatorForMyPosts(
  rawCreatorId: string
): Promise<MyPostsCreatorRow | null> {
  const { data, error } = await supabaseAdmin
    .from("creators")
    .select("id, user_id")
    .or(`id.eq.${rawCreatorId},user_id.eq.${rawCreatorId}`)
    .maybeSingle<MyPostsCreatorRow>()

  if (error) {
    throw error
  }

  return data
}

export async function findCreatorForListCreatorPosts(
  creatorId: string
): Promise<ListCreatorPostsCreatorRow | null> {
  const { data, error } = await supabaseAdmin
    .from("creators")
    .select(`
      id,
      user_id,
      status,
      profiles!inner (
        id,
        is_deactivated,
        is_delete_pending,
        deleted_at,
        is_banned
      )
    `)
    .eq("id", creatorId)
    .maybeSingle<ListCreatorPostsCreatorRow>()

  if (error) {
    throw error
  }

  return data
}

export async function findPostRowsForCreatorPostList(params: {
  creatorId: string
  limit: number
  status?: "draft" | "published" | "archived"
}): Promise<ListCreatorPostsPostRow[]> {
  let query = supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, title, content, status, visibility, price, published_at, created_at, updated_at, visibility_status, moderation_status, deleted_at"
    )
    .eq("creator_id", params.creatorId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(params.limit)

  if (params.status) {
    query = query.eq("status", params.status)
  }

  const { data, error } = await query.returns<ListCreatorPostsPostRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function findMyPostRowsByCreatorId(params: {
  creatorId: string
  status?: "draft" | "scheduled" | "published"
  limit: number
}): Promise<MyPostsPostRow[]> {
  let query = supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, content, status, visibility, created_at, published_at"
    )
    .eq("creator_id", params.creatorId)
    .is("deleted_at", null)

  if (params.status) {
    query = query.eq("status", params.status)
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(params.limit)
    .returns<MyPostsPostRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}





export async function findCreatorStudioPostRowsByCreatorId(
  creatorId: string
): Promise<CreatorStudioPostRow[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, creator_id, title, content, status, visibility, created_at, updated_at, deleted_at"
    )
    .eq("creator_id", creatorId)
    .in("status", ["draft", "scheduled", "published", "archived"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .returns<CreatorStudioPostRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function findCreatorStudioPostById(params: {
  postId: string
  creatorId: string
}): Promise<CreatorStudioPostDetailRow | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, creator_id, title, content, status, visibility, price, created_at, updated_at, deleted_at"
    )
    .eq("id", params.postId)
    .eq("creator_id", params.creatorId)
    .in("status", ["draft", "scheduled", "published", "archived"])
    .is("deleted_at", null)
    .maybeSingle<CreatorStudioPostDetailRow>()

  if (error) {
    throw error
  }

  return data
}

export async function updatePostRow({
  postId,
  creatorId,
  updateData,
}: {
  postId: string
  creatorId: string
  updateData: Record<string, unknown>
}): Promise<UpdatedPostRow> {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .update(updateData)
    .eq("id", postId)
    .eq("creator_id", creatorId)
    .is("deleted_at", null)
    .select(
      "id, creator_id, title, content, status, visibility, price, published_at, created_at, updated_at, deleted_at"
    )
    .single<UpdatedPostRow>()

  if (error) {
    throw error
  }

  return data
}

export type CurrentPostStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "archived"
  | null

type CurrentPostStatusRow = {
  status: Exclude<CurrentPostStatus, null>
}

export async function findCurrentPostStatusById(
  postId: string
): Promise<CurrentPostStatus> {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("status")
    .eq("id", postId)
    .maybeSingle<CurrentPostStatusRow>()

  if (error) {
    throw error
  }

  return data?.status ?? null
}

export async function updatePostStatusById({
  postId,
  updateData,
}: {
  postId: string
  updateData: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("posts")
    .update(updateData)
    .eq("id", postId)

  if (error) {
    throw error
  }
}


export async function softDeletePostByCreator({
  postId,
  creatorId,
  deletedAt,
  updatedAt,
}: {
  postId: string
  creatorId: string
  deletedAt: string
  updatedAt: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("posts")
    .update({
      deleted_at: deletedAt,
      updated_at: updatedAt,
    })
    .eq("id", postId)
    .eq("creator_id", creatorId)
    .in("status", ["draft", "scheduled", "published", "archived"])
    .is("deleted_at", null)

  if (error) {
    throw error
  }
}
export type CreatedPostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  price: number
  published_at: string | null
  created_at: string
  updated_at: string
}

export async function findCreatorForPostCreate(
  creatorId: string
): Promise<PostCreateCreatorRow | null> {
  const { data, error } = await supabaseAdmin
    .from("creators")
    .select("id")
    .eq("id", creatorId)
    .maybeSingle<PostCreateCreatorRow>()

  if (error) {
    throw error
  }

  return data
}

export type InsertPostRowInput = {
  creatorId: string
  title?: string | null
  content?: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  price: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export async function insertPostRow({
  creatorId,
  title,
  content,
  status,
  visibility,
  price,
  publishedAt,
  createdAt,
  updatedAt,
}: InsertPostRowInput): Promise<CreatedPostRow> {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .insert({
      creator_id: creatorId,
      title,
      content,
      status,
      visibility,
      price,
      published_at: publishedAt,
      created_at: createdAt,
      updated_at: updatedAt,
    })
    .select(
      "id, creator_id, title, content, status, visibility, price, published_at, created_at, updated_at"
    )
    .single<CreatedPostRow>()

  if (error) {
    throw error
  }

  return data
}

export async function findPostById(
  postId: string
): Promise<PostRow | null> {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, title, content, visibility, price, status, visibility_status, moderation_status, created_at, published_at, deleted_at"
    )
    .eq("id", postId)
    .is("deleted_at", null)
    .maybeSingle<PostRow>()

  if (error) {
    throw error
  }

  return data
}

export async function findPostCreatorById(
  creatorId: string
): Promise<PostCreatorRow | null> {
  const { data, error } = await supabaseAdmin
    .from("creators")
    .select(`
      id,
      user_id,
      username,
      display_name,
      status,
      profiles!inner (
        id,
        is_deactivated,
        is_delete_pending,
        deleted_at,
        is_banned
      )
    `)
    .eq("id", creatorId)
    .maybeSingle<PostCreatorRow>()

  if (error) {
    throw error
  }

  return data
}
