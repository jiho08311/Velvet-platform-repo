export type CanViewPostInput = {
  visibility: "public" | "subscribers"
  isLocked: boolean
  viewerUserId: string | null | undefined
  creatorId: string
  isSubscribed: boolean
}

export function canViewPost(input: CanViewPostInput): boolean {
  const viewerUserId = input.viewerUserId?.trim() ?? ""
  const creatorId = input.creatorId.trim()

  if (!creatorId) {
    return false
  }

  if (viewerUserId && viewerUserId === creatorId) {
    return true
  }

  if (input.visibility === "public" && !input.isLocked) {
    return true
  }

  if (input.isSubscribed) {
    return true
  }

  return false
}