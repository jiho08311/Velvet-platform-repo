import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type CompletePassVerificationParams = {
  requestId: string;
  profileId: string;
  mock: string | null;
};

export async function completePassVerification({
  requestId,
  profileId,
  mock,
}: CompletePassVerificationParams) {
  if (!requestId) {
    throw new Error("requestId is required");
  }

  if (!profileId) {
    throw new Error("profileId is required");
  }

  if (mock !== "true") {
    throw new Error("invalid pass verification response");
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      is_adult_verified: true,
      adult_verified_at: new Date().toISOString(),
      adult_verification_method: "pass",
    })
    .eq("id", profileId);

  if (error) {
    console.error("completePassVerification error:", error);
    throw error;
  }

  return {
    success: true,
  };
}