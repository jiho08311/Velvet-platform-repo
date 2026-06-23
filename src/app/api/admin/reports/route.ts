import { NextResponse } from "next/server"
import { listReports } from "@/modules/report/public/list-reports"
import { requireAdmin } from "@/modules/admin/public/require-admin"

export async function GET() {
  try {
    await requireAdmin()
    const reports = await listReports()

    return NextResponse.json(
      { reports },
      { status: 200 },
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load reports"

    return NextResponse.json(
      { error: message },
      { status: 400 },
    )
  }
}
