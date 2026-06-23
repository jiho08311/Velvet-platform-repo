import { ForgotPasswordForm } from "@/modules/auth/public/auth-ui"

export default function ForgotPasswordPage() {
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
                비밀번호를 재설정하세요.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-16">
          <div className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-2 lg:hidden">
            <img src="/logo-mark.png" className="h-8 w-8" />
            <span className="text-lg font-semibold text-zinc-900">
              Velvet
            </span>
          </div>

          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="mb-6 space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
                Forgot password
              </h1>
              <p className="text-sm text-zinc-500">
                가입한 이메일 주소로 비밀번호 재설정 링크를 보냅니다.
              </p>
            </div>

            <ForgotPasswordForm />

            <div className="mt-6 text-center text-sm text-zinc-600">
              <a
                href="/sign-in"
                className="font-semibold text-[#C2185B] hover:underline"
              >
                로그인으로 돌아가기
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
