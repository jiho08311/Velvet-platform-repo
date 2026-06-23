import type { CreateMediaSignedUrlInput } from "@/modules/media/capabilities/media-signed-url-capability-types"
import type { MediaSignedUrlContract } from "@/modules/media/contracts/media-signed-url-contract"
import { executeMediaSignedUrlRuntime } from "@/modules/media/runtime/execute-media-signed-url-runtime"

export async function resolveMediaSignedUrlRuntime(
  input: CreateMediaSignedUrlInput
): Promise<MediaSignedUrlContract> {
  return executeMediaSignedUrlRuntime(input)
}
