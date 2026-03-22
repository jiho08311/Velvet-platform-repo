type ProfileHeaderProps = {
  avatarUrl: string | null
  displayName: string
  username: string
  bio: string
}

export function ProfileHeader({
  avatarUrl,
  displayName,
  username,
  bio,
}: ProfileHeaderProps) {
  return (
    <section className="border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-xl font-semibold text-zinc-500">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-zinc-900">
            {displayName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">@{username}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
            {bio}
          </p>
        </div>
      </div>
    </section>
  )
}