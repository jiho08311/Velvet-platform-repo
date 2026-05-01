"use client"

import { useState } from "react"

import { buildReportTriggerPayload } from "@/modules/report/report-trigger"
import { ReportButton } from "@/modules/report/ui/ReportButton"

type PostMoreMenuProps = {
  postId: string
  pathname: string
  currentUserId?: string
}

const triggerClassName =
  "inline-flex h-9 w-9 items-center justify-center rounded-full text-lg text-zinc-400 transition hover:bg-zinc-900 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"

const menuShellClassName =
  "absolute right-0 z-20 mt-2 w-32 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 py-1 shadow-lg"

const menuActionItemClassName =
  "flex h-10 w-full items-center px-4 text-left text-sm font-medium transition hover:bg-zinc-800 focus:outline-none focus-visible:bg-zinc-800"

const destructiveMenuActionItemClassName = `${menuActionItemClassName} text-red-400`

const reportPopoverShellClassName =
  "absolute right-0 z-20 mt-2 w-[280px] rounded-2xl border border-zinc-800 bg-black p-3 shadow-2xl"

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
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Post actions"
        className={triggerClassName}
      >
        ⋯
      </button>

      {open && !showReport ? (
        <div
          role="menu"
          className={menuShellClassName}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            onClick={(event) => {
              event.stopPropagation()
              setShowReport(true)
              setOpen(false)
            }}
            className={destructiveMenuActionItemClassName}
          >
            Report
          </button>
        </div>
      ) : null}

      {showReport ? (
        <div
          className={reportPopoverShellClassName}
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
