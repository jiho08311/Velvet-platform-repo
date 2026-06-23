import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { buildCreatorPublicCard } from "./build-creator-public-card"
import { upsertCreatorPublicCard } from "@/modules/creator/repositories/creator-public-card-repository"

type CreatorRow = {
  id: string
  user_id: string
  username: string | null
  display_name: string | null
  status: string | null
}

type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  is_deactivated: boolean | null
  is_delete_pending: boolean | null
  deleted_at: string | null
  is_banned: boolean | null
}

type CanonicalCreatorRow = {
  creator_id: string
  creator_lifecycle_state: string | null
  creator_visibility_state: string | null
}

type CanonicalProfileRow = {
  profile_id: string
  profile_lifecycle_state: string | null
  identity_visibility_state: string | null
}

export async function rebuildCreatorPublicCards(input?: {
  limit?: number
  dryRun?: boolean
}) {
  const limit = Math.max(1, Math.min(input?.limit ?? 500, 5000))

  const { data: creators, error: creatorsError } = await supabaseAdmin
    .from("creators")
    .select("id, user_id, username, display_name, status")
    .limit(limit)
    .returns<CreatorRow[]>()

  if (creatorsError) throw creatorsError

  const userIds = Array.from(new Set((creators ?? []).map((row) => row.user_id)))
  const creatorIds = Array.from(new Set((creators ?? []).map((row) => row.id)))

  const [{ data: profiles, error: profilesError }, { data: canonicalCreators, error: canonicalCreatorsError }, { data: canonicalProfiles, error: canonicalProfilesError }] =
    await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, is_deactivated, is_delete_pending, deleted_at, is_banned")
        .in("id", userIds)
        .returns<ProfileRow[]>(),
      supabaseAdmin
        .from("canonical_creators")
        .select("creator_id, creator_lifecycle_state, creator_visibility_state")
        .in("creator_id", creatorIds)
        .returns<CanonicalCreatorRow[]>(),
      supabaseAdmin
        .from("canonical_profiles")
        .select("profile_id, profile_lifecycle_state, identity_visibility_state")
        .in("profile_id", userIds)
        .returns<CanonicalProfileRow[]>(),
    ])

  if (profilesError) throw profilesError
  if (canonicalCreatorsError) throw canonicalCreatorsError
  if (canonicalProfilesError) throw canonicalProfilesError

  const profileById = new Map((profiles ?? []).map((row) => [row.id, row]))
  const canonicalCreatorById = new Map(
    (canonicalCreators ?? []).map((row) => [row.creator_id, row])
  )
  const canonicalProfileById = new Map(
    (canonicalProfiles ?? []).map((row) => [row.profile_id, row])
  )

  let scannedCount = 0
  let upsertedCount = 0
  let failedCount = 0

  for (const creator of creators ?? []) {
    scannedCount += 1

    try {
      const card = buildCreatorPublicCard({
        creator,
        profile: profileById.get(creator.user_id) ?? null,
        canonicalCreator: canonicalCreatorById.get(creator.id) ?? null,
        canonicalProfile: canonicalProfileById.get(creator.user_id) ?? null,
      })

      if (!input?.dryRun) {
        const { error } = await upsertCreatorPublicCard(card)

        if (error) throw error
      }

      upsertedCount += 1
    } catch {
      failedCount += 1
    }
  }

  return {
    scannedCount,
    upsertedCount,
    failedCount,
  }
}