import { Avatar } from "@/shared/ui/Avatar"

export function CreatorIdentitySection({
  avatarUrl,
  displayName,
  username,
}: {
  avatarUrl: string | null
  displayName: string
  username: string
}) {
  return (
    <div className="flex items-end gap-4 sm:gap-5">
      <div className="rounded-full border-4 border-zinc-950 bg-zinc-900 shadow-[0_0_0_1px_rgba(39,39,42,0.6)]">
        <Avatar
          src={avatarUrl}
          alt={displayName}
          fallback={displayName}
          size="xl"
        />
      </div>

      <div className="pb-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {displayName}
        </h1>

        <p className="mt-1 text-sm text-zinc-500">@{username}</p>
      </div>
    </div>
  )
}
