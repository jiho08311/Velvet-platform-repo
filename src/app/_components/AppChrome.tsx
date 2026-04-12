"use client"

import { MobileNavigation } from "@/app/_components/MobileNavigation"
import { usePathname } from "next/navigation"
import { AppHeader } from "@/app/_components/AppHeader"
import { AppSidebar } from "@/app/_components/AppSidebar"
import Footer from "@/shared/ui/Footer"

const HIDE_CHROME_PATHS = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/reactivate-account",
  "/account-unavailable",
  "/verify-pass",
  "/verify-pass-required",
]

export function AppChrome({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const shouldHideChrome = HIDE_CHROME_PATHS.some((path) =>
    pathname.startsWith(path)
  )

  if (shouldHideChrome) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <AppHeader />

      {/* 🔥 전체 컨테이너 넓힘 */}
      <div className="mx-auto flex w-full max-w-[1400px]">
        <div className="hidden md:block self-start">
          <AppSidebar />
        </div>

        <main className="min-w-0 flex-1 px-0 pb-20 pt-4 md:px-6 md:pb-10 md:pt-6">
          {/* ❌ max-w-4xl 제거 → feed에서 폭 제어 */}
          <div className="mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      <MobileNavigation />
      <Footer />
    </div>
  )
}