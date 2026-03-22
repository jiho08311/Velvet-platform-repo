"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/modules/auth/server/require-user";
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id";
import { createCreatorProfile } from "@/modules/creator/server/create-creator-profile";

export async function becomeCreatorAction() {
  const user = await requireUser();

  const existingCreator = await getCreatorByUserId(user.id);

  if (existingCreator) {
    redirect("/dashboard");
  }

await createCreatorProfile({
  userId: user.id,
});

  redirect("/dashboard");
}