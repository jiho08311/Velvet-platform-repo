// src/modules/media/repositories/media-asset-repository.ts

import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type MediaAssetType = "image" | "video" | "audio" | "file"
export type MediaAssetProcessingStatus =
  | "pending"
  | "processing"
  | "ready"
  | "failed"

export type MediaAssetRow = {
  id: string
  legacy_media_id: string | null
  owner_user_id: string
  media_type: MediaAssetType
  mime_type: string | null
  original_filename: string | null
  file_size_bytes: number | null
  storage_bucket: string
  storage_path: string
  checksum_sha256: string | null
  processing_status: MediaAssetProcessingStatus
  source_surface: string
  created_at: string
  updated_at: string
}

export type InsertMediaAssetInput = {
  legacyMediaId?: string | null
  ownerUserId: string
  mediaType: MediaAssetType
  mimeType?: string | null
  originalFilename?: string | null
  fileSizeBytes?: number | null
  storageBucket: string
  storagePath: string
  checksumSha256?: string | null
  processingStatus?: MediaAssetProcessingStatus
  sourceSurface: string
}

export async function findMediaAssetsByLegacyMediaIds(
  legacyMediaIds: string[]
): Promise<MediaAssetRow[]> {
  if (legacyMediaIds.length === 0) {
    return []
  }

  const { data, error } = await supabaseAdmin
    .from("media_assets")
    .select("*")
    .in("legacy_media_id", legacyMediaIds)
    .returns<MediaAssetRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function insertMediaAsset(
  input: InsertMediaAssetInput
): Promise<MediaAssetRow> {
  const { data, error } = await supabaseAdmin
    .from("media_assets")
    .insert({
      legacy_media_id: input.legacyMediaId ?? null,
      owner_user_id: input.ownerUserId,
      media_type: input.mediaType,
      mime_type: input.mimeType ?? null,
      original_filename: input.originalFilename ?? null,
      file_size_bytes: input.fileSizeBytes ?? null,
      storage_bucket: input.storageBucket,
      storage_path: input.storagePath,
      checksum_sha256: input.checksumSha256 ?? null,
      processing_status: input.processingStatus ?? "ready",
      source_surface: input.sourceSurface,
    })
    .select("*")
    .single<MediaAssetRow>()

  if (error || !data) {
    throw error ?? new Error("Failed to insert media asset")
  }

  return data
}

export async function findMediaAssetsByIds(
  mediaIds: string[]
): Promise<MediaAssetRow[]> {
  if (mediaIds.length === 0) {
    return []
  }

  const { data, error } = await supabaseAdmin
    .from("media_assets")
    .select("*")
    .in("id", mediaIds)
    .returns<MediaAssetRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function findMediaAssetById(
  mediaId: string
): Promise<MediaAssetRow | null> {
  const { data, error } = await supabaseAdmin
    .from("media_assets")
    .select("*")
    .eq("id", mediaId)
    .maybeSingle<MediaAssetRow>()

  if (error) {
    throw error
  }

  return data ?? null
}

export async function updateMediaAssetProcessingStatus(input: {
  mediaId: string
  processingStatus: MediaAssetProcessingStatus
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("media_assets")
    .update({
      processing_status: input.processingStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.mediaId)

  if (error) {
    throw error
  }
}