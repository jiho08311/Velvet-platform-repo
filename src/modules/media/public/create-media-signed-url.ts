import { toMediaSignedUrlResponse } from "@/modules/media/contracts/media-signed-url-contract"
import { executeMediaSignedUrlRuntime } from "@/modules/media/runtime/execute-media-signed-url-runtime"

export const PUBLIC_CONTRACT = true

export type CreateMediaSignedUrlInput = Parameters<
  typeof executeMediaSignedUrlRuntime
>[0]

export async function createMediaSignedUrl(
  input: CreateMediaSignedUrlInput
): Promise<string> {
  const contract = await executeMediaSignedUrlRuntime(input)

  return toMediaSignedUrlResponse(contract)
}
