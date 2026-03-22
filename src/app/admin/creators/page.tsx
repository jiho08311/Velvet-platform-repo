
import Link from "next/link"

export default async function AdminCreatorsPage() {
  const creators: {
    id: string
    username: string
    displayName: string
    subscriptionPrice: number
    status: string
    createdAt: string
  }[] = []

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 text-white">
      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6">
        <h1 className="text-2xl font-semibold">Creators</h1>
        <p className="mt-2 text-sm text-white/60">
          Manage creator accounts and subscriptions.
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-950">
        {creators.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-base font-medium text-white">
              No creators found
            </p>
            <p className="mt-2 text-sm text-white/60">
              Creator accounts will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[180px_1fr_140px_120px_200px] gap-4 border-b border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/50">
              <span>Username</span>
              <span>Display Name</span>
              <span>Price</span>
              <span>Status</span>
              <span>Created</span>
            </div>

            <ul className="divide-y divide-white/10">
              {creators.map((creator) => (
                <li
                  key={creator.id}
                  className="grid grid-cols-[180px_1fr_140px_120px_200px] items-center gap-4 px-5 py-4"
                >
                  <span>@{creator.username}</span>
                  <span>{creator.displayName}</span>
                  <span>${creator.subscriptionPrice}</span>
                  <span className="text-sm text-white/70">
                    {creator.status}
                  </span>
                  <span className="text-sm text-white/60">
                    {new Date(creator.createdAt).toLocaleString()}
                  </span>

                  <div className="col-span-full">
                    <Link
                      href={`/creator/${creator.username}`}
                      className="text-sm text-blue-400 hover:underline"
                    >
                      View creator
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  )
}