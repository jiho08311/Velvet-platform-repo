// src/modules/media/public/create-media-asset.ts

import {
  createMediaAssetRuntime,
} from "@/modules/media/runtime/create-media-asset-runtime"

export const PUBLIC_CONTRACT = true

export type CreateMediaAssetInput = Parameters<typeof createMediaAssetRuntime>[0]
export type MediaAssetContract = Awaited<ReturnType<typeof createMediaAssetRuntime>>

export async function createMediaAsset(
  input: CreateMediaAssetInput
): Promise<MediaAssetContract> {
  return createMediaAssetRuntime(input)
}
