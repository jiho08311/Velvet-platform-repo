import { NextResponse } from "next/server"
import { requireSession } from "@/modules/auth/public/require-session"
import { listReports } from "@/modules/report/public/list-reports"

export async function GET() {
  try {
   await requireSession()

    const reports = await listReports()

    return NextResponse.json(
      { reports },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load reports"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}