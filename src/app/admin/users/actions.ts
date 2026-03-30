"use server"

import { revalidatePath } from "next/cache"
import { toggleUserStatus } from "@/modules/admin/server/toggle-user-status"
import { toggleUserBan } from "@/modules/admin/server/toggle-user-ban"

export async function toggleUserStatusAction(formData: FormData) {
  const userId = String(formData.get("userId"))
  const deactivate = formData.get("deactivate") === "true"

  if (!userId) {
    throw new Error("Invalid userId")
  }

  await toggleUserStatus({
    targetUserId: userId,
    deactivate,
  })

  revalidatePath("/admin/users")
}

export async function toggleUserBanAction(formData: FormData) {
  const userId = String(formData.get("userId"))
  const ban = formData.get("ban") === "true"

  if (!userId) {
    throw new Error("Invalid userId")
  }

  await toggleUserBan({
    targetUserId: userId,
    ban,
  })

  revalidatePath("/admin/users")
}