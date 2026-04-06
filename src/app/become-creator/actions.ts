"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/modules/auth/server/require-user";
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id";
import { createCreatorProfile } from "@/modules/creator/server/create-creator-profile";

export async function becomeCreatorAction(formData: FormData) {
  const user = await requireUser();

  const existingCreator = await getCreatorByUserId(user.id);

  if (existingCreator) {
    redirect("/dashboard");
  }

  const instagramUsername =
    formData.get("instagram")?.toString().trim() || undefined;

  await createCreatorProfile({
    userId: user.id,
    instagramUsername,
  });

  redirect("/dashboard");
}