import { FeedListSkeleton } from "@/modules/feed/ui/FeedListSkeleton"
import { FeedComposer } from "@/modules/feed/ui/FeedComposer"

export default function FeedLoading() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-3xl space-y-4 px-0 py-2">
        <FeedComposer />
        <FeedListSkeleton count={4} />
      </div>
    </main>
  )
}