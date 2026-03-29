export type CanViewPostInput = {
  visibility: "public" | "subscribers" | "paid"
  viewerUserId: string | null | undefined
  creatorId?: string | null
  isSubscribed: boolean
  hasPurchased?: boolean
}

export function canViewPost(input: CanViewPostInput): boolean {
  const viewerUserId = input.viewerUserId?.trim() ?? ""
  const creatorId = input.creatorId?.trim() ?? ""

  if (!creatorId) return false

  if (viewerUserId && viewerUserId === creatorId) {
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