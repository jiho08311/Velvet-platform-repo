"use server";

import { redirect } from "next/navigation";
import { resolveRedirectTarget } from "@/modules/auth/lib/redirect-handoff";
import { requireOnboardingReadyUser } from "@/modules/auth/server/require-onboarding-ready-user";
import { readCreatorReadiness } from "@/modules/creator/server/read-creator-readiness";
import { createCreatorProfile } from "@/modules/creator/server/create-creator-profile";

export async function becomeCreatorAction(formData: FormData) {
  const resolvedNext = resolveRedirectTarget({
    fallback: "/dashboard",
    target: formData.get("next")?.toString(),
  });
  const user = await requireOnboardingReadyUser({
    signInNext: "/become-creator",
  });

  const creatorReadiness = await readCreatorReadiness({
    userId: user.id,
  });

  if (creatorReadiness.ok) {
    redirect(resolvedNext);
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

  redirect(resolvedNext);
}
