import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth/public/get-current-user";
import { normalizePassVerificationNext } from "@/modules/auth/public/assert-pass-verified";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);

  const profileId = searchParams.get("profileId");
  const next = searchParams.get("next");
  const normalizedNext = next ? normalizePassVerificationNext(next) : null;

  if (!user || !profileId || profileId !== user.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
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
