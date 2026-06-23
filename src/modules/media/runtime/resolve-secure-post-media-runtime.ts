import type { SecurePostMediaContract } from "@/modules/media/contracts/secure-post-media-contract"
import {
  executeSecurePostMediaRuntime,
  type ExecuteSecurePostMediaRuntimeInput,
} from "@/modules/media/runtime/execute-secure-post-media-runtime"

export async function resolveSecurePostMediaRuntime(
  input: ExecuteSecurePostMediaRuntimeInput
): Promise<SecurePostMediaContract> {
  return executeSecurePostMediaRuntime(input)
}
