// src/app/api/auth/pass/start/route.ts
import { NextResponse } from "next/server";
import { normalizePassVerificationNext } from "@/modules/auth/server/assert-pass-verified";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const profileId = searchParams.get("profileId");
  const next = searchParams.get("next");
  const normalizedNext = next ? normalizePassVerificationNext(next) : null;

  if (!profileId) {
    return NextResponse.redirect(
      new URL("/verify-pass?error=missing_profile_id", origin)
    );
  }

  const requestId = crypto.randomUUID();
  const callbackSearchParams = new URLSearchParams({
    requestId,
    profileId,
    mock: "true",
  });

  if (normalizedNext) {
    callbackSearchParams.set("next", normalizedNext);
  }

  return NextResponse.redirect(
    new URL(`/api/auth/pass/callback?${callbackSearchParams.toString()}`, origin)
  );
}
