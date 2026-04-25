import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type ActiveUserBlockReason =
  | "profile_not_found"
  | "account_deleted"
  | "account_requires_reactivation"

type ProfileStatusRow = {
  is_deactivated: boolean | null
  is_delete_pending: boolean | null
  delete_scheduled_for: string | null
  deleted_at: string | null
}

type ReadActiveUserStateParams = {
  userId: string
}

type ReadActiveUserStateResult =
  | {
      ok: true
    }
  | {
      ok: false
      reason: ActiveUserBlockReason
    }

export async function readActiveUserState({
  userId,
}: ReadActiveUserStateParams): Promise<ReadActiveUserStateResult> {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("is_deactivated, is_delete_pending, delete_scheduled_for, deleted_at")
    .eq("id", userId)
    .maybeSingle<ProfileStatusRow>()

  if (error) {
    throw error
  }

  if (!profile) {
    return {
      ok: false,
      reason: "profile_not_found",
    }
  }

  if (profile.deleted_at) {
    return {
      ok: false,
      reason: "account_deleted",
    }
  }

  const now = new Date()
  const isDeleteExpired =
    profile.is_delete_pending &&
    profile.delete_scheduled_for &&
    new Date(profile.delete_scheduled_for).getTime() <= now.getTime()

  if (isDeleteExpired) {
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        deleted_at: now.toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      throw updateError
    }

    return {
      ok: false,
      reason: "account_deleted",
    }
  }

  if (profile.is_deactivated || profile.is_delete_pending) {
    return {
      ok: false,
      reason: "account_requires_reactivation",
    }
  }

  return {
    ok: true,
  }
}