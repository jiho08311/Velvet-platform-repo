import Link from "next/link"
import { getCreatorById } from "@/modules/creator/server/get-creator-by-id"

type AdminCreatorDetailPageProps = {
  params: Promise<{
    creatorId: string
  }>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatPrice(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amountCents / 100)
}

export default async function AdminCreatorDetailPage({
  params,
}: AdminCreatorDetailPageProps) {
  const { creatorId } = await params
  const creator = await getCreatorById(creatorId)

  if (!creator) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <Link
            href="/admin/creators"
            className="inline-flex w-fit items-center rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            ← Back to creators
          </Link>

          <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <h1 className="text-2xl font-semibold text-white">
              Creator not found
            </h1>
            <p className="mt-3 text-sm text-zinc-400">
              This creator detail is not available.
            </p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/admin/creators"
            className="inline-flex items-center rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            ← Back
          </Link>

          <div className="flex gap-3">
            <button
              type="button"
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              Suspend
            </button>
            <button
              type="button"
              className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
            >
              Ban
            </button>
          </div>
        </div>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/20">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Creator detail
          </h1>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                Username
              </p>
              <p className="mt-3 text-sm text-zinc-200">@{creator.username}</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                Display name
              </p>
              <p className="mt-3 text-sm text-zinc-200">
                {creator.displayName}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                Subscription price
              </p>
              <p className="mt-3 text-sm text-zinc-200">
                {formatPrice(
                  creator.subscriptionPriceCents,
                  creator.subscriptionCurrency
                )}{" "}
                / month
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                Status
              </p>
              <p className="mt-3 text-sm capitalize text-zinc-200">
                {creator.status}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 md:col-span-2">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                Created at
              </p>
              <p className="mt-3 text-sm text-zinc-200">
                {formatDate(creator.createdAt)}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href={`/creator/${creator.username}`}
              className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              View creator page
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}