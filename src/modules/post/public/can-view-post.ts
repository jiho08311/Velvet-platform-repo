import {
  canViewPost as canViewPostInternal,
  type CanViewPostInput,
} from "@/modules/post/server/can-view-post"

export type { CanViewPostInput }

export function canViewPost(input: CanViewPostInput): boolean {
  return canViewPostInternal(input)
}
