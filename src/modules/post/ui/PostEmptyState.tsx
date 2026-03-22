import { EmptyState } from "@/shared/ui/EmptyState"

type PostEmptyStateProps = {
  title?: string
  description?: string
}

export function PostEmptyState({
  title = "No posts yet",
  description = "Posts will appear here once they are created.",
}: PostEmptyStateProps) {
  return (
    <div className="border border-zinc-200 bg-white p-4">
      <EmptyState title={title} description={description} />
    </div>
  )
}