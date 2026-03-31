import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { getSession } from "@/modules/auth/server/get-session"
import { getProfileByUserId } from "@/modules/profile/server/get-profile-by-user-id"
import { updateProfile } from "@/modules/profile/server/update-profile"
import { createClient } from "@/infrastructure/supabase/server"
import { EditProfileForm } from "@/modules/profile/ui/EditProfileForm" // ✅ 추가

type ProfileEditFormData = {
  displayName: string
  bio: string
  avatarUrl: string | null
}

function getSessionUserId(session: unknown) {
  if (!session || typeof session !== "object") return null

  if ("userId" in session && typeof session.userId === "string") {
    return session.userId
  }

  if (
    "user" in session &&
    session.user &&
    typeof session.user === "object" &&
    "id" in session.user &&
    typeof session.user.id === "string"
  ) {
    return session.user.id
  }

  return null
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

function sanitizeFileName(fileName: string) {
  const extension = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase() ?? "png"
    : "png"

  return `avatar.${extension.replace(/[^a-z0-9]/g, "") || "png"}`
}

export default async function ProfileEditPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const userId = getSessionUserId(session)
  if (!userId) redirect("/sign-in")

  const profileData = await getProfileByUserId(userId)
  const profile = normalizeProfileData(profileData)

  async function updateProfileAction(formData: FormData) {
    "use server"

    const session = await getSession()
    const userId = getSessionUserId(session)
    if (!userId) redirect("/sign-in")

    const supabase = await createClient()

    const displayName = String(formData.get("displayName") || "")
    const bio = String(formData.get("bio") || "")
    const file = formData.get("avatar") as File | null

    let avatarUrl = profile.avatarUrl

    if (file && file.size > 0) {
      const safeFileName = sanitizeFileName(file.name)
      const filePath = `${userId}/${Date.now()}-${safeFileName}`

      const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

      if (error) throw error

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      avatarUrl = data.publicUrl
    }

    await updateProfile({
      userId,
      displayName,
      bio,
      avatarUrl,
    })

    revalidatePath("/profile")
    revalidatePath(`/creator/${profileData?.username ?? ""}`)

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

        {/* ✅ 핵심 교체 */}
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