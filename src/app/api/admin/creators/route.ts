import { NextResponse } from "next/server"
import { listCreators } from "@/modules/admin/server/list-creators"

export async function GET() {
  try {
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