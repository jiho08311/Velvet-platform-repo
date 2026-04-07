"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createReportAction } from "@/app/actions/create-report-action"

type ReportTargetType = "post" | "message" | "user" | "creator" | "comment"

type ReportButtonProps = {
  targetType: ReportTargetType
  targetId: string
  pathname: string
  currentUserId?: string
}

const REASONS = [
  "spam",
  "harassment",
  "nudity",
  "violence",
  "hate",
  "impersonation",
  "scam",
  "other",
]

export function ReportButton({
  targetType,
  targetId,
  pathname,
  currentUserId,
}: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const isGuest = !currentUserId

  function handleClick() {
    if (isGuest) {
      router.push(`/sign-in?next=${encodeURIComponent(pathname)}`)
      return
    }

    setOpen((prev) => !prev)
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        className="px-0 py-1 text-xs text-zinc-500 hover:text-white"
      >
        {open ? "Cancel report" : "Report"}
      </button>

      {open ? (
        <form
          action={createReportAction}
          className="space-y-3 px-0 py-2"
        >
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />
          <input type="hidden" name="pathname" value={pathname} />

          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Reason</label>
            <select
              name="reason"
              required
             className="w-full border-b border-zinc-800 bg-black px-0 py-2 text-sm text-white outline-none"
              defaultValue=""
            >
              <option value="" disabled>
                Select reason
              </option>
              {REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Description</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Add details"
className="w-full border-b border-zinc-800 bg-black px-0 py-2 text-sm text-white outline-none"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-500"
          >
            Submit report
          </button>
        </form>
      ) : null}
    </div>
  )
}