import {
  readCanonicalProfileIdentityByUserId,
  readCanonicalProfileIdentityByUsername,
} from "@/modules/identity/repositories/identity-read-model-repository"

export const PUBLIC_CONTRACT = true

export type ProfileIdentityReadContract = {
  id: string
  username: string | null
  is_deactivated?: boolean | null
  is_delete_pending?: boolean | null
  delete_scheduled_for?: string | null
  deleted_at?: string | null
}

function mapCanonicalProfileIdentity(row: {
  profile_id: string
  username: string | null
  profile_lifecycle_state: string | null
}): ProfileIdentityReadContract {
  return {
    id: row.profile_id,
    username: row.username,
    is_deactivated: row.profile_lifecycle_state === "deactivated",
    is_delete_pending: row.profile_lifecycle_state === "delete_pending",
    delete_scheduled_for: null,
    deleted_at: null,
  }
}

export async function readProfileIdentityByUserId(
  userId: string,
): Promise<ProfileIdentityReadContract | null> {
  const { data: canonical, error } =
    await readCanonicalProfileIdentityByUserId(userId)

  if (error) throw error

  return canonical
    ? mapCanonicalProfileIdentity(canonical)
    : null
}

export async function readProfileIdentityByUsername(
  username: string,
): Promise<ProfileIdentityReadContract | null> {
  const { data: canonical, error } =
    await readCanonicalProfileIdentityByUsername(username)

  if (error) throw error

  return canonical
    ? mapCanonicalProfileIdentity(canonical)
    : null
}
