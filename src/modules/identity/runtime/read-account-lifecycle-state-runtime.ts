import { readCanonicalProfileStatus } from "../repositories/identity-read-model-repository"

export type AccountLifecycleState =
  | "active"
  | "deactivated"
  | "delete_pending"
  | "deleted"
  | "profile_not_found"

export type AccountLifecycleReadModel = {
  state: AccountLifecycleState
  isDeactivated: boolean
  isDeletePending: boolean
  deleteScheduledFor: string | null
  deletedAt: string | null
}

function normalizeCanonicalLifecycle(value: string | null | undefined) {
  if (
    value === "active" ||
    value === "deactivated" ||
    value === "delete_pending" ||
    value === "banned" ||
    value === "deleted"
  ) {
    return value
  }

  return null
}

export async function readAccountLifecycleStateRuntime({
  profileId,
}: {
  profileId: string
}): Promise<AccountLifecycleReadModel> {
  const { data: canonical } = await readCanonicalProfileStatus(profileId)

  if (!canonical) {
    return {
      state: "profile_not_found",
      isDeactivated: false,
      isDeletePending: false,
      deleteScheduledFor: null,
      deletedAt: null,
    }
  }

  const lifecycle = normalizeCanonicalLifecycle(
    canonical.profile_lifecycle_state,
  )

  if (lifecycle === "deleted") {
    return {
      state: "deleted",
      isDeactivated: false,
      isDeletePending: false,
      deleteScheduledFor: null,
      deletedAt: null,
    }
  }

  if (lifecycle === "delete_pending") {
    return {
      state: "delete_pending",
      isDeactivated: false,
      isDeletePending: true,
      deleteScheduledFor: null,
      deletedAt: null,
    }
  }

  if (lifecycle === "deactivated" || lifecycle === "banned") {
    return {
      state: "deactivated",
      isDeactivated: true,
      isDeletePending: false,
      deleteScheduledFor: null,
      deletedAt: null,
    }
  }

  return {
    state: "active",
    isDeactivated: false,
    isDeletePending: false,
    deleteScheduledFor: null,
    deletedAt: null,
  }
}