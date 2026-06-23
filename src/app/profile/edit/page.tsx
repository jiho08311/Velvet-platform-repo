// src/app/profile/edit/page.tsx
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { readSession } from "@/modules/auth/public/read-session"
import {
  buildPathWithNext,
  SIGN_IN_PATH,
} from "@/modules/auth/utils/redirect-handoff"
import { getProfileByUserId } from "@/modules/profile/public/get-profile-by-user-id"
import { updateProfile } from "@/modules/profile/public/update-profile"
import { uploadProfileAvatar } from "@/modules/profile/public/upload-profile-avatar"
import { EditProfileForm } from "@/modules/profile/public/profile-ui"
import { logger } from "@/shared/observability/structured-logger"

type ProfileEditFormData = {
  displayName: string
  bio: string
  avatarUrl: string | null
}



function getStringValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string") return value
  }
  return null
}

function normalizeProfileData(profileData: unknown): ProfileEditFormData {
  if (!profileData || typeof profileData !== "object") {
    return {
      displayName: "",
      bio: "",
      avatarUrl: null,
    }
  }

  const profile = profileData as Record<string, unknown>

  return {
    displayName:
      getStringValue(profile, ["displayName", "display_name", "name"]) || "",
    bio: getStringValue(profile, ["bio"]) || "",
    avatarUrl: getStringValue(profile, ["avatarUrl", "avatar_url"]),
  }
}

export default async function ProfileEditPage() {
  const nextPath = "/profile/edit"
  const session = await readSession()
  if (!session) {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: nextPath,
      })
    )
  }

  const userId = session?.userId ?? null
  if (!userId) {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: nextPath,
      })
    )
  }

  const profileData = await getProfileByUserId(userId)
  const profile = normalizeProfileData(profileData)

  async function updateProfileAction(formData: FormData) {
    "use server"

    const session = await readSession()
    const userId = session?.userId ?? null
    if (!userId) {
      redirect(
        buildPathWithNext({
          path: SIGN_IN_PATH,
          next: "/profile/edit",
        })
      )
    }

    const displayName = String(formData.get("displayName") || "").trim()
    const bio = String(formData.get("bio") || "").trim()
    const file = formData.get("avatar") as File | null

    let avatarUrl = profile.avatarUrl

    try {
      if (file && file.size > 0) {
        avatarUrl = await uploadProfileAvatar({ userId, file })
      }

      await updateProfile({
        userId,
        displayName,
        bio,
        avatarUrl,
      })
    } catch (error) {
      logger.error({
        event: "profile.edit_action_failed",
        context: { userId },
        error,
      })
      redirect("/profile/edit?error=profile_update_failed")
    }

    revalidatePath("/profile")

    if (
      profileData &&
      typeof profileData === "object" &&
      "username" in profileData &&
      typeof profileData.username === "string" &&
      profileData.username
    ) {
      revalidatePath(`/creator/${profileData.username}`)
    }

    redirect("/profile")
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">Edit profile</h1>
          <p className="text-sm text-zinc-400">
            Update your profile photo, display name, and bio.
          </p>
        </div>

        <EditProfileForm
          defaultDisplayName={profile.displayName}
          defaultBio={profile.bio}
          defaultAvatarUrl={profile.avatarUrl}
          action={updateProfileAction}
        />
      </div>
    </main>
  )
}
