"use client"

import { useState } from "react"
import { createReportAction } from "@/app/actions/create-report-action"

type ReportTargetType = "post" | "message" | "user" | "creator"

type ReportButtonProps = {
  targetType: ReportTargetType
  targetId: string
  pathname: string
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
}: ReportButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
      >
        {open ? "Cancel report" : "Report"}
      </button>

      {open ? (
        <form action={createReportAction} className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />
          <input type="hidden" name="pathname" value={pathname} />

          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Reason</label>
            <select
              name="reason"
              required
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none"
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
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
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