import { Suspense } from "react"
import { redirect } from "next/navigation"

import { SignInForm } from "@/modules/auth/ui/SignInForm"
import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ProfileStatusRow = {
  is_deactivated: boolean | null
  is_delete_pending: boolean | null
  delete_scheduled_for: string | null
  deleted_at: string | null
}

export default async function SignInPage() {
  const user = await getCurrentUser()

  if (user) {
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

    if (profile?.is_deactivated || profile?.is_delete_pending) {
      redirect("/reactivate-account")
    }

    redirect("/")
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden items-center justify-center bg-gradient-to-br from-[#C2185B] to-[#AD1457] px-10 lg:flex">
          <div className="w-full max-w-md">
            <div className="flex flex-col items-start gap-6 text-white">
              <div className="flex items-center gap-4">
                <img
                  src="/logo-mark.png"
                  alt="Velvet logo"
                  className="h-14 w-14"
                />
                <span className="text-5xl font-bold tracking-tight">Velvet</span>
              </div>

              <p className="text-lg leading-8 text-white/85">
                크리에이터가 되어보세요.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-16">
          <div className="absolute top-6 left-1/2 flex -translate-x-1/2 items-center gap-2 lg:hidden">
            <img src="/logo-mark.png" className="h-8 w-8" />
            <span className="text-lg font-semibold text-zinc-900">
              Velvet
            </span>
          </div>

          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="mb-6 space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">
                로그인
              </h2>
              <p className="text-sm text-zinc-500">
                Velvet 계정에 로그인하세요
              </p>
            </div>

            <Suspense fallback={null}>
              <SignInForm />
            </Suspense>

            <div className="mt-6 text-center text-sm text-zinc-600">
              계정이 없으신가요?{" "}
              <a
                href="/sign-up"
                className="font-semibold text-[#C2185B] hover:underline"
              >
                회원가입
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}