type PostEditModerationReentryInput = {
  currentContent: string | null
  nextContent: string | null
  currentBlockFingerprint: string
  nextBlockFingerprint: string
  hasNewMedia: boolean
  hasRemovedMedia: boolean
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

export function buildPostEditBlockFingerprint(
  blocks: Array<{
    type: "text" | "image" | "video" | "audio" | "file"
    content?: string | null
    sortOrder: number
    mediaId?: string | null
  }>
): string {
  return blocks
    .map((block) => {
      const normalizedContent = normalizeText(block.content)
      const normalizedMediaId = block.mediaId?.trim() ?? ""

      return [
        block.type,
        String(block.sortOrder),
        normalizedContent,
        normalizedMediaId,
      ].join(":")
    })
    .join("|")
}

export function shouldReenterPostModerationOnEdit(
  input: PostEditModerationReentryInput
): boolean {
  if (input.hasNewMedia) {
    return true
  }

  if (input.hasRemovedMedia) {
    return true
  }

  const currentContent = normalizeText(input.currentContent)
  const nextContent = normalizeText(input.nextContent)

  if (currentContent !== nextContent) {
    return true
  }

  if (input.currentBlockFingerprint !== input.nextBlockFingerprint) {
    return true
  }

  return false
}