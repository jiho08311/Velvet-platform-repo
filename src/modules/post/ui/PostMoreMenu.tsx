"use client"

import { useState } from "react"

import { buildReportTriggerPayload } from "@/modules/report/report-trigger"
import { ReportButton } from "@/modules/report/ui/ReportButton"

type PostMoreMenuProps = {
  postId: string
  pathname: string
  currentUserId?: string
}

export function PostMoreMenu({
  postId,
  pathname,
  currentUserId,
}: PostMoreMenuProps) {
  const [open, setOpen] = useState(false)
  const [showReport, setShowReport] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setOpen((prev) => !prev)
        }}
        className="px-2 text-lg text-zinc-400 hover:text-white"
      >
        ⋯
      </button>

      {open && !showReport ? (
        <div
          className="absolute right-0 z-20 mt-2 w-32 rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setShowReport(true)
              setOpen(false)
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-800"
          >
            Report
          </button>
        </div>
      ) : null}

      {showReport ? (
        <div
          className="absolute right-0 z-20 mt-2 w-[280px] rounded-2xl border border-zinc-800 bg-black p-3 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <ReportButton
            payload={buildReportTriggerPayload({
              targetType: "post",
              targetId: postId,
              pathname,
            })}
            currentUserId={currentUserId}
            defaultOpen
            hideTrigger
            onClose={() => setShowReport(false)}
          />
        </div>
      ) : null}
    </div>
  )
}
