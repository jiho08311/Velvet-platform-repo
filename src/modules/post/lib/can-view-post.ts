export type CanViewPostInput = {
  visibility: "public" | "subscribers" | "paid"
  viewerUserId: string | null | undefined
  creatorUserId: string
  isSubscribed: boolean
  hasPurchased?: boolean
}

export function canViewPost(input: CanViewPostInput): boolean {
  const viewerUserId = input.viewerUserId?.trim() ?? ""
  const creatorUserId = input.creatorUserId.trim()

  if (!creatorUserId) return false

  // 본인 (creator.user_id 기준)
  if (viewerUserId && viewerUserId === creatorUserId) {
    return true
  }

  if (input.visibility === "public") {
    return true
  }

  if (input.visibility === "subscribers") {
    return input.isSubscribed
  }

  if (input.visibility === "paid") {
    return input.hasPurchased === true
  }

  return false
}