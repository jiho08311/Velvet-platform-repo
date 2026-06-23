import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type SearchDocumentType = "creator" | "content" | "post"

export type SearchDocumentRow = {
  id: string
  document_type: SearchDocumentType
  source_id: string
  creator_id: string | null
  user_id: string | null
  title: string | null
  body: string | null
  username: string | null
  display_name: string | null
  image_ref: string | null
  visibility_state: string
  ranking_score: number
  source_hash: string | null
  projection_version: number
  indexed_at: string
  source_updated_at: string | null
}

export type UpsertSearchDocumentInput = Omit<SearchDocumentRow, "id" | "indexed_at">

export async function upsertSearchDocument(row: UpsertSearchDocumentInput) {
  return supabaseAdmin
    .from("search_documents")
    .upsert(
      {
        ...row,
        indexed_at: new Date().toISOString(),
      },
      { onConflict: "document_type,source_id" }
    )
    .select("*")
    .single<SearchDocumentRow>()
}

export async function searchVisibleDocuments(input: {
  query: string
  limit: number
  documentType?: SearchDocumentType
}): Promise<SearchDocumentRow[]> {
  const trimmed = input.query.trim()

  if (!trimmed) return []

  let query = supabaseAdmin
    .from("search_documents")
    .select("*")
    .eq("visibility_state", "public")
    .or(
      [
        `title.ilike.%${trimmed}%`,
        `body.ilike.%${trimmed}%`,
        `username.ilike.%${trimmed}%`,
        `display_name.ilike.%${trimmed}%`,
      ].join(",")
    )
    .order("ranking_score", { ascending: false })
    .limit(input.limit)

  if (input.documentType) {
    query = query.eq("document_type", input.documentType)
  }

  const { data, error } = await query.returns<SearchDocumentRow[]>()

  if (error) throw error

  return data ?? []
}


export async function listVisibleSearchDocuments(input: {
  limit: number
  documentType?: SearchDocumentType
}): Promise<SearchDocumentRow[]> {
  let query = supabaseAdmin
    .from("search_documents")
    .select("*")
    .eq("visibility_state", "public")
    .order("ranking_score", { ascending: false })
    .order("indexed_at", { ascending: false })
    .limit(input.limit)

  if (input.documentType) {
    query = query.eq("document_type", input.documentType)
  }

  const { data, error } = await query.returns<SearchDocumentRow[]>()

  if (error) throw error

  return data ?? []
}


