export type CanViewPostInput = {
  visibility: "public" | "subscribers" | "paid"
  viewerUserId: string | null | undefined
  creatorId: string
  isSubscribed: boolean
  hasPurchased?: boolean
}

export function canViewPost(input: CanViewPostInput): boolean {
  const viewerUserId = input.viewerUserId?.trim() ?? ""
  const creatorId = input.creatorId.trim()

  if (!creatorId) return false

  // 본인은 항상 접근 가능
  if (viewerUserId && viewerUserId === creatorId) {
    return true
  }

  // public → 항상 열림
  if (input.visibility === "public") {
    return true
  }

  // subscribers → 구독 필요
  if (input.visibility === "subscribers") {
    return input.isSubscribed
  }

  // paid → 구매 필요
  if (input.visibility === "paid") {
    return input.hasPurchased === true
  }

  return false
}