import type { MediaStoragePurpose } from "@/modules/media/services/media-storage-path-service"
import { toUploadMediaResponse } from "@/modules/media/contracts/upload-media-contract"
import { executeUploadMediaRuntime } from "@/modules/media/runtime/execute-upload-media-runtime"

type UploadMediaInput = {
  uploaderUserId: string
  file: File
  purpose?: MediaStoragePurpose
}

export async function uploadMediaUseCase(input: UploadMediaInput): Promise<string> {
  const contract = await executeUploadMediaRuntime(input)

  return toUploadMediaResponse(contract)
}
