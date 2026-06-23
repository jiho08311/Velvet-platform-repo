import {
  canViewPost as canViewPostPolicy,
  type CanViewPostInput,
} from "@/modules/post/policies/post-visibility-policy"

export { type CanViewPostInput }

export function canViewPost(input: CanViewPostInput): boolean {
  return canViewPostPolicy(input)
}