import { NextResponse } from "next/server";
import { normalizePassVerificationNext } from "@/modules/auth/server/assert-pass-verified";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const profileId = searchParams.get("profileId");
  const next = searchParams.get("next");
  const normalizedNext = next ? normalizePassVerificationNext(next) : null;

  if (!profileId) {
    return NextResponse.json(
      { error: "profileId is required" },
      { status: 400 }
    );
  }

  const requestId = crypto.randomUUID();
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/pass/callback`;
  const callbackSearchParams = new URLSearchParams({
    requestId,
    profileId,
    mock: "true",
  });

  if (normalizedNext) {
    callbackSearchParams.set("next", normalizedNext);
  }

  const redirectUrl = `${callbackUrl}?${callbackSearchParams.toString()}`;

  return NextResponse.redirect(redirectUrl);
}
