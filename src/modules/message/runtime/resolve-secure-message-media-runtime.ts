import type { SecureMessageMediaContract } from "@/modules/message/contracts/secure-message-media-contract"
import {
  executeSecureMessageMediaRuntime,
  type ExecuteSecureMessageMediaRuntimeInput,
} from "@/modules/message/runtime/execute-secure-message-media-runtime"

export async function resolveSecureMessageMediaRuntime(
  input: ExecuteSecureMessageMediaRuntimeInput
): Promise<SecureMessageMediaContract> {
  return executeSecureMessageMediaRuntime(input)
}
