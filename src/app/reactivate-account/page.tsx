import { redirect } from "next/navigation"

import { requireUser } from "@/modules/auth/server/require-user"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export default async function ReactivateAccountPage() {
  const user = await requireUser()

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("is_deactivated")
    .eq("id", user.id)
    .single()

  if (error) {
    throw error
  }

  if (!profile?.is_deactivated) {
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