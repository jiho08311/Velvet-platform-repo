import { redirect } from "next/navigation";
import { becomeCreatorAction } from "./actions";
import { resolveRedirectTarget } from "@/modules/auth/lib/redirect-handoff";
import { requireOnboardingReadyUser } from "@/modules/auth/server/require-onboarding-ready-user";
import { readCreatorReadiness } from "@/modules/creator/server/read-creator-readiness";

type BecomeCreatorPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function BecomeCreatorPage({
  searchParams,
}: BecomeCreatorPageProps) {
  const { next } = await searchParams;
  const resolvedNext = resolveRedirectTarget({
    fallback: "/dashboard",
    target: next,
  });
  const user = await requireOnboardingReadyUser({
    signInNext: "/become-creator",
  });

  const creatorReadiness = await readCreatorReadiness({
    userId: user.id,
  });

  if (creatorReadiness.ok) {
    redirect(resolvedNext);
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 bg-gradient-to-r from-[#FCE4EC] via-white to-[#FFF1F5] px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C2185B]">
              Creator
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-zinc-900">
              Become a creator
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Start earning by sharing exclusive content.
            </p>
          </div>

          <div className="px-6 py-6">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Signed in
              </p>
              <p className="mt-2 break-all text-sm font-medium text-zinc-900">
                {user.email}
              </p>
            </div>

            <form action={becomeCreatorAction} className="mt-6 flex flex-col gap-4">
              <input type="hidden" name="next" value={resolvedNext} />

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                <p className="text-sm font-medium text-zinc-900">
                  Create your creator profile
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Your creator account will be created instantly. You can update
                  your profile details later from the dashboard.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
                <label
                  htmlFor="instagram"
                  className="text-sm font-medium text-zinc-900"
                >
                  Instagram username
                </label>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  승인 검토를 위해 사용하는 계정을 입력하세요.
                </p>
                <input
                  id="instagram"
                  name="instagram"
                  type="text"
                  placeholder="@yourinstagram"
                  className="mt-3 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#C2185B]"
                />
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
                <label
                  htmlFor="bankName"
                  className="text-sm font-medium text-zinc-900"
                >
                  Bank name
                </label>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  정산 받을 은행명을 입력하세요.
                </p>
                <input
                  id="bankName"
                  name="bankName"
                  type="text"
                  placeholder="신한은행"
                  className="mt-3 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#C2185B]"
                />
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
                <label
                  htmlFor="accountHolderName"
                  className="text-sm font-medium text-zinc-900"
                >
                  Account holder name
                </label>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  예금주명을 입력하세요.
                </p>
                <input
                  id="accountHolderName"
                  name="accountHolderName"
                  type="text"
                  placeholder="홍길동"
                  className="mt-3 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#C2185B]"
                />
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
                <label
                  htmlFor="accountNumber"
                  className="text-sm font-medium text-zinc-900"
                >
                  Account number
                </label>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  정산 받을 계좌번호를 입력하세요.
                </p>
                <input
                  id="accountNumber"
                  name="accountNumber"
                  type="text"
                  placeholder="123-456-789012"
                  className="mt-3 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#C2185B]"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-[#C2185B] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#D81B60]"
              >
                Create creator profile
              </button>
            </form>

            <p className="mt-4 text-xs text-zinc-500">
              You can edit your profile later in dashboard.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
