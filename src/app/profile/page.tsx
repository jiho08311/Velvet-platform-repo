import Link from "next/link"
import { redirect } from "next/navigation"

import { getSession } from "@/modules/auth/server/get-session"
import { getProfileByUserId } from "@/modules/profile/server/get-profile-by-user-id"
import { getUserById } from "@/modules/user/server/get-user-by-id"

type ProfileData = {
  id: string
  displayName: string
  username: string
  bio: string
  avatarUrl: string | null
  email: string
  joinedAt: string
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value))
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

function normalizeProfileData(
  profileData: unknown,
  userData: unknown
): ProfileData | null {
  const profile =
    profileData && typeof profileData === "object"
      ? (profileData as Record<string, unknown>)
      : null

  const user =
    userData && typeof userData === "object"
      ? (userData as Record<string, unknown>)
      : null

  if (!profile && !user) {
    return null
  }

  const id =
    (profile && getStringValue(profile, ["id", "userId", "user_id"])) ||
    (user && getStringValue(user, ["id"])) ||
    ""

  const displayName =
    (profile &&
      getStringValue(profile, ["displayName", "display_name", "name"])) ||
    ""

  const username =
    (profile && getStringValue(profile, ["username"])) ||
    ""

  const bio =
    (profile && getStringValue(profile, ["bio"])) ||
    ""

  const avatarUrl =
    (profile &&
      getStringValue(profile, ["avatarUrl", "avatar_url"])) ||
    null

  const email =
    (user && getStringValue(user, ["email"])) ||
    ""

  const joinedAt =
    (user && getStringValue(user, ["createdAt", "created_at", "joinedAt"])) ||
    new Date().toISOString()

  return {
    id,
    displayName,
    username,
    bio,
    avatarUrl,
    email,
    joinedAt,
  }
}

export default async function ProfilePage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const userId = getSessionUserId(session)

  if (!userId) {
    redirect("/login")
  }

  const [profileData, userData] = await Promise.all([
    getProfileByUserId(userId),
    getUserById(userId),
  ])

  const profile = normalizeProfileData(profileData, userData)

  if (!profile) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <h1 className="text-2xl font-semibold text-white">
              Profile not available
            </h1>
            <p className="mt-3 text-sm text-zinc-400">
              Profile information will appear here once it is set up.
            </p>
            <Link
              href="/profile/edit"
              className="mt-6 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Edit profile
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Profile
          </p>
          <h1 className="text-3xl font-semibold text-white">My profile</h1>
          <p className="text-sm text-zinc-400">
            Review your public profile and basic account details.
          </p>
        </div>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-3xl font-semibold text-white">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profile.displayName.slice(0, 1)
                )}
              </div>

              <div>
                <h2 className="text-3xl font-semibold text-white">
                  {profile.displayName}
                </h2>
                <p className="mt-2 text-sm text-zinc-400">@{profile.username}</p>
              </div>
            </div>

            <Link
              href="/profile/edit"
              className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Edit profile
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Bio
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-200">{profile.bio}</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                Email
              </p>
              <p className="mt-3 text-sm text-zinc-200">{profile.email}</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                Joined
              </p>
              <p className="mt-3 text-sm text-zinc-200">
                {formatDate(profile.joinedAt)}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}