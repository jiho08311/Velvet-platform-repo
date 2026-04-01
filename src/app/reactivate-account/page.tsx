import { redirect } from "next/navigation"

import { requireUser } from "@/modules/auth/server/require-user"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ProfileStatusRow = {
  is_deactivated: boolean | null
  is_delete_pending: boolean | null
  delete_scheduled_for: string | null
  deleted_at: string | null
}

export default async function ReactivateAccountPage() {
  const user = await requireUser()

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select(
      "is_deactivated, is_delete_pending, delete_scheduled_for, deleted_at"
    )
    .eq("id", user.id)
    .single<ProfileStatusRow>()

  if (error) {
    throw error
  }

  if (profile?.deleted_at) {
    redirect("/account-unavailable")
  }

  const now = new Date()
  const isDeleteExpired =
    profile?.is_delete_pending &&
    profile?.delete_scheduled_for &&
    new Date(profile.delete_scheduled_for).getTime() <= now.getTime()

  if (isDeleteExpired) {
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        deleted_at: now.toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      throw updateError
    }

    redirect("/account-unavailable")
  }

  if (!profile?.is_deactivated && !profile?.is_delete_pending) {
    redirect("/settings")
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center px-4 py-10">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 text-white">
        <h1 className="text-2xl font-semibold">Account deactivated</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Your account is currently deactivated. Reactivate your account to continue using the platform.
        </p>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="text-sm text-zinc-300">Signed in as</p>
          <p className="mt-1 text-sm font-medium text-white">
            {user.email ?? "Unknown user"}
          </p>
        </div>

        <form action="/api/account/reactivate" method="post" className="mt-6">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-full bg-pink-600 px-5 text-sm font-medium text-white transition hover:bg-pink-500 active:bg-pink-700"
          >
            Reactivate account
          </button>
        </form>
      </section>
    </main>
  )
}