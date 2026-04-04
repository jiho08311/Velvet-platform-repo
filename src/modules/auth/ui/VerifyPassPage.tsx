// src/modules/auth/ui/VerifyPassPage.tsx
"use client"

type VerifyPassPageProps = {
  profileId: string
}

export function VerifyPassPage({ profileId }: VerifyPassPageProps) {
  function handleClick() {
    window.location.href = `/api/auth/pass/start?profileId=${encodeURIComponent(
      profileId
    )}`
  }

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

          <button
            onClick={handleClick}
            className="w-full rounded-2xl bg-[#C2185B] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#D81B60]"
          >
            PASS 인증하기
          </button>
        </div>
      </div>
    </main>
  )
}