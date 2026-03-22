import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { sendPayout } from "@/modules/payout/server/send-payout"

export async function GET() {
  try {
    // 1. 처리 대상 payout 조회 (pending + failed)
    const { data: payouts, error } = await supabaseAdmin
      .from("payouts")
      .select("id")
      .in("status", ["pending", "failed"])
      .limit(20)

    if (error) {
      throw error
    }

    const results: any[] = []

    // 2. 하나씩 처리
    for (const payout of payouts ?? []) {
      try {
        const result = await sendPayout({
          payoutId: payout.id,
        })

        results.push({
          payoutId: payout.id,
          success: true,
          result,
        })
      } catch (error) {
        results.push({
          payoutId: payout.id,
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error("CRON PAYOUT ERROR:", error)

    return NextResponse.json(
      { error: "Failed to run payout cron" },
      { status: 500 }
    )
  }
}