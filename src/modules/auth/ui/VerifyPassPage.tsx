// src/modules/auth/ui/VerifyPassPage.tsx
"use client"

import { PassVerificationButton } from "./PassVerificationButton"

type VerifyPassPageProps = {
  profileId: string
  next?: string | null
}

export function VerifyPassPage({ profileId, next }: VerifyPassPageProps) {
  return (
    <main className="min-h-screen bg-white">
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-6 space-y-2">
            <h1 className="text-3xl font-semibold text-zinc-950">
              성인 인증
            </h1>
            <p className="text-sm text-zinc-500">
              서비스를 이용하려면 성인 인증이 필요합니다.
            </p>
          </div>

          <PassVerificationButton
            profileId={profileId}
            next={next}
            loadingLabel="PASS 인증하기"
          >
            PASS 인증하기
          </PassVerificationButton>
        </div>
      </div>
    </main>
  )
}
