import { NextResponse } from "next/server"
import { listCreators } from "@/modules/admin/public/list-creators"
import { requireAdmin } from "@/modules/admin/public/require-admin"

export async function GET() {
  try {
    await requireAdmin()
    const creators = await listCreators()

    return NextResponse.json(
      { creators },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load creators"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}
