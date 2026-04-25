import { redirect } from "next/navigation"

import { getSession } from "@/modules/auth/server/get-session"
import {
  buildPathWithNext,
  SIGN_IN_PATH,
} from "@/modules/auth/lib/redirect-handoff"
import { getCreatorById } from "@/modules/creator/server/get-creator-by-id"
import { getProfileByUserId } from "@/modules/profile/server/get-profile-by-user-id"

type CreatorSettingsFormData = {
  displayName: string
  bio: string
  subscriptionPrice: string
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

function getNumberValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }

    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return null
}

function normalizeCreatorSettings(
  profileData: unknown,
  creatorData: unknown
): CreatorSettingsFormData {
  const profile =
    profileData && typeof profileData === "object"
      ? (profileData as Record<string, unknown>)
      : null

  const creator =
    creatorData && typeof creatorData === "object"
      ? (creatorData as Record<string, unknown>)
      : null

  const displayName =
    (profile &&
      getStringValue(profile, ["displayName", "display_name", "username"])) ||
    ""

  const bio =
    (profile && getStringValue(profile, ["bio", "description"])) || ""

  const subscriptionPriceValue =
    (creator &&
      getNumberValue(creator, [
        "subscriptionPrice",
        "subscription_price",
        "monthlyPrice",
        "monthly_price",
      ])) ||
    0

  return {
    displayName,
    bio,
    subscriptionPrice: subscriptionPriceValue.toFixed(2),
  }
}

export default async function CreatorSettingsPage() {
  const nextPath = "/creator/settings"
  const session = await getSession()

  if (!session) {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: nextPath,
      })
    )
  }

  const userId = getSessionUserId(session)

  if (!userId) {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: nextPath,
      })
    )
  }

  const [profileData, creatorData] = await Promise.all([
    getProfileByUserId(userId),
    getCreatorById(userId),
  ])

  const creator = normalizeCreatorSettings(profileData, creatorData)

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Creator
          </p>
          <h1 className="text-3xl font-semibold text-white">Settings</h1>
          <p className="text-sm text-zinc-400">
            Update your creator profile and subscription setup.
          </p>
        </div>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/20">
          <form className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                  Avatar
                </p>
                <div className="mt-4 flex h-32 items-center justify-center rounded-2xl border border-dashed border-zinc-800 text-sm text-zinc-500">
                  Avatar placeholder
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                  Cover
                </p>
                <div className="mt-4 flex h-32 items-center justify-center rounded-2xl border border-dashed border-zinc-800 text-sm text-zinc-500">
                  Cover placeholder
                </div>
              </div>
            </div>

            <label className="flex flex-col gap-3">
              <span className="text-sm font-medium text-zinc-200">
                Creator display name
              </span>
              <input
                type="text"
                name="displayName"
                defaultValue={creator.displayName}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600"
                placeholder="Enter creator display name"
              />
            </label>

            <label className="flex flex-col gap-3">
              <span className="text-sm font-medium text-zinc-200">
                Creator bio
              </span>
              <textarea
                name="bio"
                defaultValue={creator.bio}
                rows={6}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600"
                placeholder="Write your creator bio"
              />
            </label>

            <label className="flex flex-col gap-3">
              <span className="text-sm font-medium text-zinc-200">
                Subscription price
              </span>
              <div className="flex items-center rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4">
                <span className="text-sm text-zinc-400">$</span>
                <input
                  type="text"
                  name="subscriptionPrice"
                  defaultValue={creator.subscriptionPrice}
                  className="w-full bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                  placeholder="0.00"
                />
                <span className="text-sm text-zinc-500">/ month</span>
              </div>
            </label>

            <div className="pt-2">
              <button
                type="submit"
                className="rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
              >
                Save settings
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
