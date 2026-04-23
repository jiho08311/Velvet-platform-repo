"use server";

import { redirect } from "next/navigation";
import { readOnboardingReadiness } from "@/modules/auth/server/read-onboarding-readiness";
import { requireActiveUser } from "@/modules/auth/server/require-active-user";
import { readCreatorReadiness } from "@/modules/creator/server/read-creator-readiness";
import { createCreatorProfile } from "@/modules/creator/server/create-creator-profile";

export async function becomeCreatorAction(formData: FormData) {
  let user: Awaited<ReturnType<typeof requireActiveUser>>;

  try {
    user = await requireActiveUser();
  } catch {
    redirect("/sign-in?next=/become-creator");
  }

  const readiness = await readOnboardingReadiness({
    userId: user.id,
  });

  if (!readiness.ok) {
    redirect("/onboarding");
  }

  const creatorReadiness = await readCreatorReadiness({
    userId: user.id,
  });

  if (creatorReadiness.ok) {
    redirect("/dashboard");
  }

  const instagramUsername =
    formData.get("instagram")?.toString().trim() || undefined;

  const bankName = formData.get("bankName")?.toString().trim() || "";
  const accountHolderName =
    formData.get("accountHolderName")?.toString().trim() || "";
  const accountNumber =
    formData.get("accountNumber")?.toString().trim() || "";

  await createCreatorProfile({
    userId: user.id,
    instagramUsername,
    bankName,
    accountHolderName,
    accountNumber,
  });

  redirect("/dashboard");
}
