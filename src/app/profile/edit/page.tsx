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
      const filePath = `${userId}/${Date.now()}-${file.name}`

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

  const previewInitial = (profile.displayName || "U").slice(0, 1).toUpperCase()

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">Edit profile</h1>
          <p className="text-sm text-zinc-400">
            Update your profile photo, display name, and bio.
          </p>
        </div>

        <form action={updateProfileAction} className="flex flex-col gap-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName || "Profile avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-2xl font-semibold text-white">
                  {previewInitial}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="avatar"
                className="inline-flex cursor-pointer items-center rounded-full bg-[#C2185B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D81B60]"
              >
                Upload avatar
              </label>
              <input
                id="avatar"
                type="file"
                name="avatar"
                accept="image/*"
                className="hidden"
              />
              <p className="text-xs text-zinc-500">
                JPG, PNG, WEBP recommended.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Display name
            </label>
            <input
              name="displayName"
              defaultValue={profile.displayName}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Bio
            </label>
            <textarea
              name="bio"
              defaultValue={profile.bio}
              rows={5}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/20"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Save
            </button>

            <Link
              href="/profile"
              className="inline-flex items-center rounded-full border border-zinc-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}