// src/app/onboarding/page.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/infrastructure/supabase/server"
import { readOnboardingReadiness } from "@/modules/auth/server/read-onboarding-readiness"
import { OnboardingForm } from "@/modules/profile/ui/OnboardingForm"

export default async function OnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  const readiness = await readOnboardingReadiness({
    userId: user.id,
  })

  if (readiness.ok) {
    redirect("/")
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-6 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              username 설정
            </h1>
            <p className="text-sm text-zinc-500">
              가입을 완료하려면 username을 설정해주세요.
            </p>
          </div>

          <OnboardingForm />
        </div>
      </div>
    </main>
  )
}
