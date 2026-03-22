// src/app/messages/[conversationId]/loading.tsx
export default function ConversationLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10">
      <div className="mx-auto max-w-3xl animate-pulse space-y-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="max-w-md rounded-2xl bg-zinc-800 p-4"
          >
            <div className="h-4 w-40 rounded bg-zinc-700" />
            <div className="mt-2 h-4 w-56 rounded bg-zinc-700" />
          </div>
        ))}
      </div>
    </main>
  )
}