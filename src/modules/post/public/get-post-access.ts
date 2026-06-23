import {
  getPostAccess as getPostAccessInternal,
} from "@/modules/post/policies/get-post-access"

export const PUBLIC_CONTRACT = true

export type GetPostAccessInput = Parameters<typeof getPostAccessInternal>[0]
export type GetPostAccessResult = Awaited<ReturnType<typeof getPostAccessInternal>>

export async function getPostAccess(
  input: GetPostAccessInput
): Promise<GetPostAccessResult> {
  return getPostAccessInternal(input)
}
