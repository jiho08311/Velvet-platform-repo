// src/app/api/auth/pass/callback/route.ts
import { NextResponse } from "next/server";
import { completePassVerification } from "@/modules/auth/server/complete-pass-verification";
import {
  getPassVerificationRedirectPath,
  normalizePassVerificationNext,
} from "@/modules/auth/server/assert-pass-verified";
import { resolveRedirectTarget } from "@/modules/auth/lib/redirect-handoff";

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
    const { searchParams, origin } = new URL(request.url);

    const requestId = searchParams.get("requestId");
    const profileId = searchParams.get("profileId");
    const mock = searchParams.get("mock");
    const next = searchParams.get("next");
    const normalizedNext = next ? normalizePassVerificationNext(next) : null;

    if (!requestId || !profileId) {
      return NextResponse.redirect(
        new URL(
          getPassVerificationErrorRedirectPath({
            error: "missing_pass_params",
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
    console.error("PASS CALLBACK ERROR", error);
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
