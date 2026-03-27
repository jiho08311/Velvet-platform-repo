type CreatorHeaderProps = {
  avatarUrl: string | null
  displayName: string
  username: string
  bio: string
  subscriptionPriceCents: number
  status: "pending" | "active" | "suspended"
}

export function CreatorHeader({
  avatarUrl,
  displayName,
  username,
  bio,
  subscriptionPriceCents,
}: CreatorHeaderProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-2xl font-semibold text-white/60">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {displayName}
          </h1>

          <p className="mt-1 text-sm text-white/60">@{username}</p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/75">
            {bio}
          </p>

          <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/85">
        ₩{subscriptionPriceCents.toLocaleString()}/month
          </div>
        </div>
      </div>
    </section>
  )
}