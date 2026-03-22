import Link from "next/link"
import Image from "next/image"
import { Card } from "@/shared/ui/Card"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-10 sm:px-6">
        <Card className="w-full overflow-hidden p-0 shadow-sm">
          <div className="bg-gradient-to-r from-[#C2185B]/10 via-white to-white px-8 py-12 sm:px-10 sm:py-16">
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">

              {/* 🔥 로고 추가 */}
              <div className="mb-6 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Velvet logo"
                  width={160}
                  height={160}
                  className="rounded-2xl"
                  priority
                />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C2185B]">
                Velvet
              </p>

              <h1 className="mt-4 text-4xl font-semibold text-zinc-900 sm:text-5xl">
                Creator Platform
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
                Build your audience, share exclusive content, and start earning
                with subscriptions.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                <Link
                  href="/feed"
                  className="inline-flex items-center justify-center rounded-full bg-[#C2185B] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#D81B60]"
                >
                  Go to feed
                </Link>

                <Link
                  href="/become-creator"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  Become a creator
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}