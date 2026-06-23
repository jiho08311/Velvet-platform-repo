import {
  hasPurchasedPost as hasPurchasedPostRuntime,
} from "@/modules/payment/runtime/has-purchased-post"

export const PUBLIC_CONTRACT = true

export type HasPurchasedPostInput = Parameters<typeof hasPurchasedPostRuntime>[0]

export async function hasPurchasedPost(
  input: HasPurchasedPostInput
): Promise<boolean> {
  return hasPurchasedPostRuntime(input)
}
