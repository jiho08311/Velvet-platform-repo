import Link from "next/link"

import { getPaymentResultPageState } from "@/modules/payment/server/payment-result-state"
import { Card } from "@/shared/ui/Card"

type PaymentFailPageProps = {
  searchParams?: Promise<{
    reason?: string
  }>
}

export default async function PaymentFailPage({
  searchParams,
}: PaymentFailPageProps) {
  const params = searchParams ? await searchParams : undefined
  const resultState = getPaymentResultPageState(params?.reason)

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 sm:px-6">
      <div className="mx-auto max-w-xl">
        <Card className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl">
            ✕
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950">
            {resultState.title}
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {resultState.message}
          </p>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {resultState.notice}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/feed"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#C2185B] px-5 text-sm font-medium text-white transition hover:bg-[#D81B60] active:bg-[#AD1457]"
            >
              피드로 돌아가기
            </Link>

            <Link
              href="/dashboard/payments"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              결제 내역 보기
            </Link>
          </div>
        </Card>
      </div>
    </main>
  )
}
