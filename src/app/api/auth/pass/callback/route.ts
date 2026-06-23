// src/app/api/auth/pass/callback/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth/public/get-current-user";
import { completePassVerification } from "@/modules/auth/public/complete-pass-verification";
import {
  getPassVerificationRedirectPath,
  normalizePassVerificationNext,
} from "@/modules/auth/public/assert-pass-verified";
import { resolveRedirectTarget } from "@/modules/auth/utils/redirect-handoff";
import { logger } from "@/shared/observability/structured-logger";

function getPassVerificationErrorRedirectPath({
  error,
  next,
}: {
  error: string;
  next?: string | null;
}) {
  const redirectPath = getPassVerificationRedirectPath({
    next: next ?? undefined,
  });
  const separator = redirectPath.includes("?") ? "&" : "?";

  return `${redirectPath}${separator}error=${encodeURIComponent(error)}`;
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams, origin } = new URL(request.url);

    const requestId = searchParams.get("requestId");
    const profileId = searchParams.get("profileId");
    const mock = searchParams.get("mock");
    const next = searchParams.get("next");
    const normalizedNext = next ? normalizePassVerificationNext(next) : null;

    if (!user || !requestId || !profileId || profileId !== user.id) {
      return NextResponse.redirect(
        new URL(
          getPassVerificationErrorRedirectPath({
            error: "unauthorized_pass_callback",
            next: normalizedNext,
          }),
          origin
        )
      );
    }

    await completePassVerification({
      requestId,
      profileId,
      mock,
    });

    return NextResponse.redirect(
      new URL(resolveRedirectTarget({ target: normalizedNext }), origin)
    );
  } catch (error) {
    logger.error({
      event: "auth.pass_callback_failed",
      error,
    });
    const { searchParams, origin } = new URL(request.url);
    const next = searchParams.get("next");
    const normalizedNext = next ? normalizePassVerificationNext(next) : null;

    return NextResponse.redirect(
      new URL(
        getPassVerificationErrorRedirectPath({
          error: "pass_verification_failed",
          next: normalizedNext,
        }),
        origin
      )
    );
  }
}
