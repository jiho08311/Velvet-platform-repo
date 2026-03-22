type ProfileStatsProps = {
  postCount: number
  subscriberCount: number
}

export function ProfileStats({
  postCount,
  subscriberCount,
}: ProfileStatsProps) {
  return (
    <section className="border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-6">
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {postCount}
          </p>
          <p className="text-xs text-zinc-500">Posts</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {subscriberCount}
          </p>
          <p className="text-xs text-zinc-500">Subscribers</p>
        </div>
      </div>
    </section>
  )
}