"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/modules/auth/server/require-user";
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id";
import { createCreator } from "@/modules/creator/server/create-creator";

export async function becomeCreatorAction(formData: FormData) {
  const user = await requireUser();

  const existingCreator = await getCreatorByUserId(user.id);

  if (existingCreator) {
    redirect("/dashboard");
  }

  const instagramUsername =
    formData.get("instagram")?.toString().trim() || undefined;

  const bankName = formData.get("bankName")?.toString().trim() || "";
  const accountHolderName =
    formData.get("accountHolderName")?.toString().trim() || "";
  const accountNumber =
    formData.get("accountNumber")?.toString().trim() || "";

  await createCreator({
    userId: user.id,
    instagramUsername,
    bankName,
    accountHolderName,
    accountNumber,
  });

  redirect("/dashboard");
}