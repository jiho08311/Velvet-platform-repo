// src/app/post/[postId]/loading.tsx
export default function PostDetailLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10">
      <div className="mx-auto max-w-3xl animate-pulse space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-zinc-800" />
          <div className="h-4 w-40 rounded bg-zinc-800" />
        </div>
        <div className="h-5 w-3/4 rounded bg-zinc-800" />
        <div className="h-5 w-1/2 rounded bg-zinc-800" />
        <div className="h-[420px] rounded-2xl bg-zinc-800" />
      </div>
    </main>
  )
}