import { NextResponse } from "next/server"
import { processMessageOutbox } from "@/modules/message/public/process-message-outbox"
import {
  isRouteGuardError,
  requireInternalJobSecret,
} from "@/shared/security/route-guards"

export async function POST(request: Request) {
  try {
    requireInternalJobSecret(request)

    const result = await processMessageOutbox({
      limit: 20,
    })

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
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
            : "Failed to process message outbox",
      },
      { status: 500 }
    )
  }
}
