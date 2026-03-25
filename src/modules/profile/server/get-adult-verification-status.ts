import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type GetAdultVerificationStatusParams = {
  profileId: string
}

export async function getAdultVerificationStatus({
  profileId,
}: GetAdultVerificationStatusParams) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("is_adult_verified, adult_verification_method")
    .eq("id", profileId)
    .maybeSingle()

  if (error) {
    console.error("getAdultVerificationStatus error:", error)
    throw error
  }

  return {
    isAdultVerified: data?.is_adult_verified ?? false,
    adultVerificationMethod: data?.adult_verification_method ?? null,
  }
}