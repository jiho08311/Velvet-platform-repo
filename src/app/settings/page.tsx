import { requireActiveSession } from "@/modules/auth/public/require-active-session"
import { getProfileByUserId } from "@/modules/profile/public/get-profile-by-user-id"
import { canDeleteAccount } from "@/modules/authorization/public"

type ProfileView = {
  username?: string | null
  email?: string | null
} | null

export default async function SettingsPage() {
  const session = await requireActiveSession()
  const profileResult = await getProfileByUserId(session.userId)
  const profile = profileResult as ProfileView

const deleteAccountPermission = await canDeleteAccount({
  actorId: session.userId,
  targetUserId: session.userId,
})

const isDeleteAccountForbidden = !deleteAccountPermission.allowed

  const username =
    profile?.username ??
    profile?.email?.split("@")[0] ??
    "user"

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-white/60">
          Manage your account settings.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white">
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/80">Email</label>
              <input
                value={profile?.email ?? ""}
                disabled
                className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white/60 outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/80">
                Username
              </label>
              <input
                value={username}
                disabled
                className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white/60 outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-red-400/20 bg-neutral-950 p-6 text-white">
        <h2 className="text-lg font-semibold text-red-300">Danger zone</h2>
        <p className="mt-2 text-sm text-white/60">
          Deactivate your account temporarily or schedule it for deletion.
          Deleted accounts will be blocked permanently after 7 days.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {!isDeleteAccountForbidden ? (
            <form action="/api/settings/deactivate" method="post">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-white/80 transition hover:bg-white/5"
              >
                Deactivate account
              </button>
            </form>
          ) : (
            <div className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-white/40">
              Super admin accounts cannot be deactivated here
            </div>
          )}

          {!isDeleteAccountForbidden ? (
            <form action="/api/settings/delete-account" method="post">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-red-400/20 px-4 text-sm font-medium text-red-300 transition hover:bg-red-400/10"
              >
                Delete account
              </button>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  )
}