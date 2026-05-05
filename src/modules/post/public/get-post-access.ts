import {
  getPostAccess as getPostAccessInternal,
} from "@/modules/post/server/get-post-access"

type GetPostAccessInput = Parameters<typeof getPostAccessInternal>[0]

export async function getPostAccess(input: GetPostAccessInput) {
  return getPostAccessInternal(input)
}