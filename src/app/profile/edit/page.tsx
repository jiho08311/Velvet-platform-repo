import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { getSession } from "@/modules/auth/server/get-session"
import { getProfileByUserId } from "@/modules/profile/server/get-profile-by-user-id"
import { updateProfile } from "@/modules/profile/server/update-profile"
import { createClient } from "@/infrastructure/supabase/server"

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

export default async function ProfileEditPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const userId = getSessionUserId(session)
  if (!userId) redirect("/login")

  const profileData = await getProfileByUserId(userId)
  const profile = normalizeProfileData(profileData)

  async function updateProfileAction(formData: FormData) {
    "use server"

    const session = await getSession()
    const userId = getSessionUserId(session)
    if (!userId) redirect("/login")

    const supabase = await createClient()

    const displayName = String(formData.get("displayName") || "")
    const bio = String(formData.get("bio") || "")
    const file = formData.get("avatar") as File | null

    let avatarUrl = profile.avatarUrl

    if (file && file.size > 0) {
      const filePath = `avatars/${userId}-${Date.now()}-${file.name}`

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

    redirect("/profile")
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <h1 className="text-3xl text-white">Edit profile</h1>

        <form action={updateProfileAction} className="flex flex-col gap-6">
          <input
            name="displayName"
            defaultValue={profile.displayName}
            className="border p-3 bg-zinc-900 text-white"
          />

          <textarea
            name="bio"
            defaultValue={profile.bio}
            className="border p-3 bg-zinc-900 text-white"
          />

          <input type="file" name="avatar" accept="image/*" />

          <button className="bg-white text-black p-3">
            Save
          </button>

          <Link href="/profile">Cancel</Link>
        </form>
      </div>
    </main>
  )
}