import type {
  PostBlock,
  PostRenderInput,
  PostRenderMediaItem,
} from "@/modules/post/types"

import { buildPostRenderInput } from "./post-render-input"

type PostRenderCompatibilityInput = {
  renderInput?: PostRenderInput
  text?: string
  media?: PostRenderMediaItem[]
  blocks?: PostBlock[]
}

/**
 * Compatibility boundary for legacy render fields.
 * New render surfaces should provide renderInput directly.
 */
export function resolvePostRenderInputForCompatibility({
  renderInput,
  text,
  media = [],
  blocks = [],
}: PostRenderCompatibilityInput): PostRenderInput {
  if (renderInput) {
    return renderInput
  }

  return buildPostRenderInput({
    text: text ?? "",
    media,
    blocks,
  })
}
