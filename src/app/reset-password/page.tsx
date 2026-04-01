import { ResetPasswordForm } from "@/modules/auth/ui/ResetPasswordForm"

export default function ResetPasswordPage() {
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
                새로운 비밀번호를 설정하세요.
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
                Reset password
              </h1>
              <p className="text-sm text-zinc-500">
                새 비밀번호를 입력하고 계정을 다시 보호하세요.
              </p>
            </div>

            <ResetPasswordForm />
          </div>
        </section>
      </div>
    </main>
  )
}