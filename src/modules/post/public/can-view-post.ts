import {
  canViewPost as canViewPostInternal,
} from "@/modules/post/policies/can-view-post"

export const PUBLIC_CONTRACT = true

export type CanViewPostInput = Parameters<typeof canViewPostInternal>[0]

export function canViewPost(input: CanViewPostInput): boolean {
  return canViewPostInternal(input)
}
