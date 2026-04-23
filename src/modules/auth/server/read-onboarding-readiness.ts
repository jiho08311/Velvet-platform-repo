import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type OnboardingReadinessBlockReason = "profile_not_found" | "username_required"

type ProfileOnboardingRow = {
  username: string | null
}

type ReadOnboardingReadinessParams = {
  userId: string
}

type ReadOnboardingReadinessResult =
  | {
      ok: true
    }
  | {
      ok: false
      reason: OnboardingReadinessBlockReason
    }

export async function readOnboardingReadiness({
  userId,
}: ReadOnboardingReadinessParams): Promise<ReadOnboardingReadinessResult> {
  const resolvedUserId = userId.trim()

  if (!resolvedUserId) {
    return {
      ok: false,
      reason: "profile_not_found",
    }
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("username")
    .eq("id", resolvedUserId)
    .maybeSingle<ProfileOnboardingRow>()

  if (error) {
    throw error
  }

  if (!profile) {
    return {
      ok: false,
      reason: "profile_not_found",
    }
  }

  if (!profile.username) {
    return {
      ok: false,
      reason: "username_required",
    }
  }

  return {
    ok: true,
  }
}
