import { EmptyState } from "@/shared/ui/EmptyState"

type PostEmptyStateProps = {
  title?: string
  description?: string
}

export function PostEmptyState({
  title = "No posts yet",
  description = "Posts will appear here once they are created.",
}: PostEmptyStateProps) {
  return <EmptyState title={title} description={description} />
}