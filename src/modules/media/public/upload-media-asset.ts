// src/modules/media/public/upload-media-asset.ts

"use server"
// PUBLIC_CONTRACT

import {
  uploadMediaAssetRuntime,
  type UploadMediaAssetRuntimeContract,
  type UploadMediaAssetRuntimeInput,
} from "@/modules/media/runtime/upload-media-asset-runtime"

export type UploadMediaAssetInput = UploadMediaAssetRuntimeInput
export type { UploadMediaAssetRuntimeContract }

export async function uploadMediaAsset(
  input: UploadMediaAssetInput
): Promise<UploadMediaAssetRuntimeContract> {
  return uploadMediaAssetRuntime(input)
}
