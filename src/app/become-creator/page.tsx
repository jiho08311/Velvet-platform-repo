import { redirect } from "next/navigation";
import { becomeCreatorAction } from "./actions";
import { requireUser } from "@/modules/auth/server/require-user";
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id";

export default async function BecomeCreatorPage() {
  let user: Awaited<ReturnType<typeof requireUser>>;

  try {
    user = await requireUser();
  } catch {
    redirect("/sign-in?next=/become-creator");
  }

  const creator = await getCreatorByUserId(user.id);

  if (creator) {
    redirect("/dashboard");
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
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                <p className="text-sm font-medium text-zinc-900">
                  Create your creator profile
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Your creator account will be created instantly. You can update
                  your profile details later from the dashboard.
                </p>
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