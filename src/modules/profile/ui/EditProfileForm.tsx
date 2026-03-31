"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

type EditProfileFormProps = {
  defaultDisplayName: string
  defaultBio: string
  defaultAvatarUrl: string | null
  action: (formData: FormData) => void
}

export function EditProfileForm({
  defaultDisplayName,
  defaultBio,
  defaultAvatarUrl,
  action,
}: EditProfileFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultAvatarUrl)

  const previewInitial = useMemo(() => {
    const base = defaultDisplayName.trim()
    return (base || "U").slice(0, 1).toUpperCase()
  }, [defaultDisplayName])

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      setPreviewUrl(defaultAvatarUrl)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={defaultDisplayName || "Profile avatar"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-2xl font-semibold text-white">
              {previewInitial}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="avatar"
            className="inline-flex cursor-pointer items-center rounded-full bg-[#C2185B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D81B60]"
          >
            Upload avatar
          </label>

          <input
            id="avatar"
            type="file"
            name="avatar"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />

          <p className="text-xs text-zinc-500">
            Selected image will appear here before saving.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">
          Display name
        </label>
        <input
          name="displayName"
          defaultValue={defaultDisplayName}
          className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/20"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">
          Bio
        </label>
        <textarea
          name="bio"
          defaultValue={defaultBio}
          rows={5}
          className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/20"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          Save
        </button>

        <Link
          href="/profile"
          className="inline-flex items-center rounded-full border border-zinc-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}