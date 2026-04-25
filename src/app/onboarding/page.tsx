// src/app/onboarding/page.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/infrastructure/supabase/server"
import { readOnboardingReadiness } from "@/modules/auth/server/read-onboarding-readiness"
import {
  buildPathWithNext,
  ONBOARDING_PATH,
  resolveRedirectTarget,
  SIGN_IN_PATH,
} from "@/modules/auth/lib/redirect-handoff"
import { OnboardingForm } from "@/modules/profile/ui/OnboardingForm"

type OnboardingPageProps = {
  searchParams: Promise<{
    next?: string
  }>
}

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const { next } = await searchParams
  const resolvedNext = resolveRedirectTarget({
    fallback: "/",
    target: next,
  })
  const onboardingPath = buildPathWithNext({
    path: ONBOARDING_PATH,
    next: resolvedNext,
  })
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: onboardingPath,
      })
    )
  }

  const readiness = await readOnboardingReadiness({
    userId: user.id,
  })

  if (readiness.ok) {
    redirect(resolvedNext)
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

          <OnboardingForm next={resolvedNext} />
        </div>
      </div>
    </main>
  )
}
