import { redirect } from "next/navigation"

import { getSession } from "@/modules/auth/server/get-session"

type MediaLibraryItem = {
  id: string
  type: "image" | "video" | "audio"
  createdAt: string
  thumbnailUrl: string | null
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function getSessionUserId(session: unknown) {
  if (!session || typeof session !== "object") {
    return null
  }

  if ("userId" in session && typeof session.userId === "string") {
    return session.userId
  }

  if (
    "user" in session &&
    session.user &&
    typeof session.user === "object" &&
    "id" in session.user &&
    typeof session.user.id === "string"
  ) {
    return session.user.id
  }

  return null
}

function getStringValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === "string" && value.length > 0) {
      return value
    }
  }

  return null
}

function normalizeMediaType(value: string | null): MediaLibraryItem["type"] {
  if (value === "video") {
    return "video"
  }

  if (value === "audio") {
    return "audio"
  }

  return "image"
}

function normalizeMediaItem(item: unknown, index: number): MediaLibraryItem | null {
  if (!item || typeof item !== "object") {
    return null
  }

  const source = item as Record<string, unknown>

  const id = getStringValue(source, ["id", "mediaId"]) ?? `media_${index + 1}`

  const createdAt =
    getStringValue(source, ["createdAt", "created_at", "uploadedAt", "uploaded_at"]) ??
    new Date().toISOString()

  const type = normalizeMediaType(
    getStringValue(source, ["type", "mediaType", "kind", "mimeCategory"])
  )

  const thumbnailUrl = getStringValue(source, [
    "thumbnailUrl",
    "thumbnail_url",
    "previewUrl",
    "preview_url",
    "url",
  ])

  return {
    id,
    type,
    createdAt,
    thumbnailUrl,
  }
}

function normalizeMediaItems(data: unknown) {
  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map((item, index) => normalizeMediaItem(item, index))
    .filter((item): item is MediaLibraryItem => item !== null)
}

export default async function CreatorMediaPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const userId = getSessionUserId(session)

  if (!userId) {
    redirect("/login")
  }

  const mediaData = await listMedia(userId)
  const mediaItems = normalizeMediaItems(mediaData)

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
              Creator
            </p>
            <h1 className="text-3xl font-semibold text-white">Media library</h1>
            <p className="text-sm text-zinc-400">
              Manage your uploaded media assets in one place.
            </p>
          </div>

          <button
            type="button"
            className="rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
          >
            Upload media
          </button>
        </div>

        {mediaItems.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <h2 className="text-2xl font-semibold text-white">No media yet</h2>
            <p className="mt-3 text-sm text-zinc-400">
              Uploaded media will appear here once you add content.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {mediaItems.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-2xl shadow-black/20"
              >
                <div className="flex h-52 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60 text-sm text-zinc-500">
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl}
                      alt={item.type}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    "Thumbnail"
                  )}
                </div>

                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                      {item.type}
                    </p>
                    <p className="mt-2 text-sm text-zinc-400">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}