// src/modules/media/runtime/create-media-asset-runtime.ts

import {
  insertMediaAsset,
  type MediaAssetProcessingStatus,
  type MediaAssetRow,
  type MediaAssetType,
} from "@/modules/media/repositories/media-asset-repository"
import { writeDomainEventWithOutbox } from "@/modules/events/public"
import { buildMediaEventEnvelope } from "@/modules/media/events"



export type CreateMediaAssetRuntimeInput = {
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

export type MediaAssetContract = {
  id: string
  legacyMediaId: string | null
  ownerUserId: string
  mediaType: MediaAssetType
  mimeType: string | null
  originalFilename: string | null
  fileSizeBytes: number | null
  storageBucket: string
  storagePath: string
  checksumSha256: string | null
  processingStatus: MediaAssetProcessingStatus
  sourceSurface: string
  createdAt: string
  updatedAt: string
}

function mapMediaAssetRowToContract(
  row: MediaAssetRow
): MediaAssetContract {
  return {
    id: row.id,
    legacyMediaId: row.legacy_media_id,
    ownerUserId: row.owner_user_id,
    mediaType: row.media_type,
    mimeType: row.mime_type,
    originalFilename: row.original_filename,
    fileSizeBytes: row.file_size_bytes,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    checksumSha256: row.checksum_sha256,
    processingStatus: row.processing_status,
    sourceSurface: row.source_surface,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function createMediaAssetRuntime(
  input: CreateMediaAssetRuntimeInput
): Promise<MediaAssetContract> {
  const storageBucket = input.storageBucket.trim()
  const storagePath = input.storagePath.trim()
  const ownerUserId = input.ownerUserId.trim()

  if (!ownerUserId) {
    throw new Error("ownerUserId is required")
  }

  if (!storageBucket) {
    throw new Error("storageBucket is required")
  }

  if (!storagePath) {
    throw new Error("storagePath is required")
  }

  const row = await insertMediaAsset({
    legacyMediaId: input.legacyMediaId ?? null,
    ownerUserId,
    mediaType: input.mediaType,
    mimeType: input.mimeType ?? null,
    originalFilename: input.originalFilename ?? null,
    fileSizeBytes: input.fileSizeBytes ?? null,
    storageBucket,
    storagePath,
    checksumSha256: input.checksumSha256 ?? null,
    processingStatus: input.processingStatus ?? "ready",
    sourceSurface: input.sourceSurface,
  })


    const contract = mapMediaAssetRowToContract(row)

  await writeDomainEventWithOutbox(
    buildMediaEventEnvelope({
      eventType: "MediaUploaded",
      aggregateId: contract.id,
      producerSurface: input.sourceSurface,
      sourceFile: "src/modules/media/runtime/create-media-asset-runtime.ts",
      sourceTable: "media_assets",
      sourceRowId: contract.id,
      actorId: contract.ownerUserId,
      subjectUserId: contract.ownerUserId,
      payload: {
        assetId: contract.id,
        ownerUserId: contract.ownerUserId,
        mediaType: contract.mediaType,
        mimeType: contract.mimeType,
        storageBucket: contract.storageBucket,
        storagePath: contract.storagePath,
        processingStatus: contract.processingStatus,
        originalFilename: contract.originalFilename,
        fileSizeBytes: contract.fileSizeBytes,
        uploadedAt: contract.createdAt,
      },
      idempotencyKey: `media_uploaded:${contract.id}`,
      outboxRequired: true,
      replayable: true,
    }),
  )

  return contract


}