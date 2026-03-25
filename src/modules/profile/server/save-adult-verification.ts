import type { AdultVerificationMethod } from "../types";

type SaveAdultVerificationParams = {
  supabase: {
    from: (table: string) => {
      update: (values: Record<string, unknown>) => {
        eq: (column: string, value: string) => {
          select: () => Promise<{ error: { message: string } | null }>;
        };
      };
    };
  };
  profileId: string;
  birthDate: string;
  isAdultVerified: boolean;
  verificationMethod: AdultVerificationMethod;
};

export async function saveAdultVerification({
  supabase,
  profileId,
  birthDate,
  isAdultVerified,
  verificationMethod,
}: SaveAdultVerificationParams): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      birth_date: birthDate,
      is_adult_verified: isAdultVerified,
      adult_verified_at: isAdultVerified ? new Date().toISOString() : null,
      adult_verification_method: verificationMethod,
    })
    .eq("id", profileId)
    .select();

  if (error) {
    throw new Error(error.message);
  }
}