"use client"

import Link from "next/link"

import { Card } from "@/shared/ui/Card"

type GlobalErrorProps = {
  error: Error
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-xl">
        <Card className="p-6 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-900/40 text-xl text-red-400">
            !
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            문제가 발생했어요
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            요청을 처리하는 중 오류가 발생했어요. 다시 시도해 주세요.
          </p>

          <div className="mt-6 rounded-2xl border border-red-900/60 bg-red-950/60 px-4 py-3 text-sm text-red-300">
            {error.message || "알 수 없는 오류가 발생했어요."}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#C2185B] px-5 text-sm font-medium text-white transition hover:bg-[#D81B60] active:bg-[#AD1457]"
            >
              다시 시도
            </button>

            <Link
              href="/feed"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              피드로 이동
            </Link>
          </div>
        </Card>
      </div>
    </main>
  )
}