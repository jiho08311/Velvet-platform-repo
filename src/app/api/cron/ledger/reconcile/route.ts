import { NextRequest, NextResponse } from "next/server"

import { runFinancialReconciliation } from "@/modules/ledger/public/run-financial-reconciliation"
import {
  isRouteGuardError,
  requireCronSecret,
} from "@/shared/security/route-guards"

function parseLimit(request: NextRequest): number {
  const raw = request.nextUrl.searchParams.get("limit")
  const parsed = raw ? Number(raw) : 500

  if (!Number.isFinite(parsed)) return 500

  return Math.max(1, Math.min(5000, Math.floor(parsed)))
}

export async function POST(request: NextRequest) {
  try {
    requireCronSecret(request)

    const result = await runFinancialReconciliation({
      limit: parseLimit(request),
    })

    return NextResponse.json(
      {
        ok: true,
        ...result,
      },
      { status: result.status === "ok" ? 200 : 409 }
    )
  } catch (error) {
    if (isRouteGuardError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to run financial reconciliation",
      },
      { status: 500 }
    )
  }
}
