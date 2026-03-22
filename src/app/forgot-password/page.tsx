import Link from "next/link"

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-6 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              비밀번호 찾기
            </h1>
            <p className="text-sm text-zinc-500">
              비밀번호 재설정 기능은 곧 추가됩니다.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
            현재는 로그인 페이지에서 기존 계정으로 로그인해 주세요.
          </div>

          <div className="mt-6">
            <Link
              href="/sign-in"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[#C2185B] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#D81B60]"
            >
              로그인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}