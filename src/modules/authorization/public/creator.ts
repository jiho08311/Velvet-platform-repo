import { readCreatorReadiness } from "@/modules/creator/public/read-creator-readiness"

export async function canManageCreator(input: {
  actorId: string
  creatorId: string
}) {
  const readiness = await readCreatorReadiness({
    userId: input.actorId,
  })

  if (!readiness.ok) {
    return {
      allowed: false,
      reason: readiness.reason,
    }
  }

  return {
    allowed: readiness.creator.id === input.creatorId,
    reason:
      readiness.creator.id === input.creatorId ? null : "creator_owner_required",
  }
}

export async function canCreatePost(input: {
  actorId: string
}) {
  const readiness = await readCreatorReadiness({
    userId: input.actorId,
  })

  return {
    allowed: readiness.ok,
    reason: readiness.ok ? null : readiness.reason,
  }
}

export async function canCreateStory(input: {
  actorId: string
}) {
  const readiness = await readCreatorReadiness({
    userId: input.actorId,
  })

  return {
    allowed: readiness.ok,
    reason: readiness.ok ? null : readiness.reason,
  }
}

export async function canAccessCreatorAnalytics(input: {
  actorId: string
  creatorId: string
}) {
  return canManageCreator(input)
}

export async function canRequestPayout(input: {
  actorId: string
  creatorId: string
}) {
  return canManageCreator(input)
}