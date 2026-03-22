import Link from "next/link"
import { redirect } from "next/navigation"

import { getSession } from "@/modules/auth/server/get-session"
import { getProfileByUserId } from "@/modules/profile/server/get-profile-by-user-id"

type ProfileEditFormData = {
  displayName: string
  bio: string
  avatarUrl: string | null
}

function getSessionUserId(session: unknown) {
  if (!session || typeof session !== "object") {
    return null
  }

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

    if (typeof value === "string") {
      return value
    }
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

  if (!session) {
    redirect("/login")
  }

  const userId = getSessionUserId(session)

  if (!userId) {
    redirect("/login")
  }

  const profileData = await getProfileByUserId(userId)
  const profile = normalizeProfileData(profileData)

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Profile
          </p>
          <h1 className="text-3xl font-semibold text-white">Edit profile</h1>
          <p className="text-sm text-zinc-400">
            Update your profile information and public presentation.
          </p>
        </div>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/20">
          <form className="flex flex-col gap-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                Avatar
              </p>

              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-3xl font-semibold text-white">
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    profile.displayName.slice(0, 1) || "?"
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
                  >
                    Change avatar
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>

            <label className="flex flex-col gap-3">
              <span className="text-sm font-medium text-zinc-200">
                Display name
              </span>
              <input
                type="text"
                name="displayName"
                defaultValue={profile.displayName}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600"
                placeholder="Enter display name"
              />
            </label>

            <label className="flex flex-col gap-3">
              <span className="text-sm font-medium text-zinc-200">Bio</span>
              <textarea
                name="bio"
                defaultValue={profile.bio}
                rows={6}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600"
                placeholder="Write your bio"
              />
            </label>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                className="rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
              >
                Save changes
              </button>

              <Link
                href="/profile"
                className="inline-flex items-center rounded-full border border-zinc-700 px-5 py-3 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
              >
                Cancel
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}