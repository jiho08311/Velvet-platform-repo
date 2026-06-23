import {
  createMediaAssetRuntime as createMediaAsset,
} from "@/modules/media/runtime/create-media-asset-runtime"

export const PUBLIC_CONTRACT = true

export type CreateMediaAssetRuntimeInput = Parameters<typeof createMediaAsset>[0]
export type MediaAssetContract = Awaited<ReturnType<typeof createMediaAsset>>

export async function createMediaAssetRuntime(
  input: CreateMediaAssetRuntimeInput
): Promise<MediaAssetContract> {
  return createMediaAsset(input)
}
