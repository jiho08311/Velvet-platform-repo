export type CreatorEntityReference = {
  creatorId: string
}

export type CreatorOwnershipReference = {
  creatorUserId: string
}

export type CreatorRouteReference = {
  username: string
}

function normalizeRequiredId(value: string, label: string): string {
  const normalized = value.trim()

  if (!normalized) {
    throw new Error(`${label} is required`)
  }

  return normalized
}

export function normalizeCreatorEntityReference(
  input: CreatorEntityReference
): CreatorEntityReference {
  return {
    creatorId: normalizeRequiredId(input.creatorId, "creatorId"),
  }
}

export function normalizeCreatorOwnershipReference(
  input: CreatorOwnershipReference
): CreatorOwnershipReference {
  return {
    creatorUserId: normalizeRequiredId(input.creatorUserId, "creatorUserId"),
  }
}

export function isCreatorOwner(input: {
  viewerUserId?: string | null
  creatorUserId?: string | null
}): boolean {
  const viewerUserId = input.viewerUserId?.trim() ?? ""
  const creatorUserId = input.creatorUserId?.trim() ?? ""

  return Boolean(viewerUserId && creatorUserId && viewerUserId === creatorUserId)
}

export function buildCreatorRoutePath(input: CreatorRouteReference): string {
  const username = input.username.trim()

  return `/creator/${encodeURIComponent(username)}`
}

export function buildCreatorMessageHref(
  input: CreatorOwnershipReference
): string {
  const creatorUserId = input.creatorUserId.trim()

  return `/messages?creatorId=${encodeURIComponent(creatorUserId)}`
}
