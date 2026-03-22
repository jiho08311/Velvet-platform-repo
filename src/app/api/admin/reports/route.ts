import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { listReports } from "@/modules/report/server/list-reports"

export async function GET() {
  try {
    await requireUser()

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