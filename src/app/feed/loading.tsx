import {
  FeedComposer,
  FeedListSkeleton,
} from "@/modules/feed/public/feed-page-ui"

export default function FeedLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto w-full max-w-3xl space-y-4 px-0 py-2">
  
        <FeedListSkeleton count={4} />
      </div>
    </main>
  )
}
