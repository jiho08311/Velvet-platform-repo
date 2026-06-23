import {
  getSecureMessageMedia as getSecureMessageMediaRuntime,
} from "@/modules/message/runtime/get-secure-message-media"

export const PUBLIC_CONTRACT = true

export type GetSecureMessageMediaInput = Parameters<
  typeof getSecureMessageMediaRuntime
>[0]
export type GetSecureMessageMediaResult = Awaited<
  ReturnType<typeof getSecureMessageMediaRuntime>
>

export async function getSecureMessageMedia(
  input: GetSecureMessageMediaInput
): Promise<GetSecureMessageMediaResult> {
  return getSecureMessageMediaRuntime(input)
}
