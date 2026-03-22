"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

import { Card } from "@/shared/ui/Card"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const paymentId = searchParams.get("paymentId")

    if (!paymentId) {
      router.replace("/payment/fail?reason=invalid_request")
      return
    }

    const confirm = async () => {
      try {
        const res = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentId,
          }),
        })

        if (!res.ok) {
          throw new Error("CONFIRM_FAILED")
        }

        const data = await res.json()

        if (!data.ok) {
          throw new Error("CONFIRM_FAILED")
        }
      } catch (error) {
        console.error("confirm failed:", error)

        router.replace("/payment/fail?reason=verification_failed")
      }
    }

    confirm()
  }, [searchParams, router])

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 sm:px-6">
      <div className="mx-auto max-w-xl">
        <Card className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl">
            ✓
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950">
            결제 처리 중이에요
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-600">
            결제 확인을 진행하고 있어요. 잠시만 기다려 주세요.
          </p>

          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            완료되면 자동으로 반영돼요.
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/feed"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#C2185B] px-5 text-sm font-medium text-white transition hover:bg-[#D81B60] active:bg-[#AD1457]"
            >
              피드로 이동
            </Link>
          </div>
        </Card>
      </div>
    </main>
  )
}