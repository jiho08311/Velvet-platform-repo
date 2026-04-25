"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createReportAction } from "@/app/actions/create-report-action"
import {
  reportFormFieldNames,
  toReportFormHiddenFields,
} from "@/modules/report/report-form"
import {
  reportReasons,
  type ReportTriggerPayload,
} from "@/modules/report/types"

type ReportButtonProps = {
  payload: ReportTriggerPayload
  currentUserId?: string

  defaultOpen?: boolean
  hideTrigger?: boolean
  onClose?: () => void
}

export function ReportButton({
  payload,
  currentUserId,
  defaultOpen = false,
  hideTrigger = false,
  onClose,
}: ReportButtonProps) {
  const { pathname } = payload
  const [open, setOpen] = useState(defaultOpen)
  const router = useRouter()

  const isGuest = !currentUserId

  function handleClick() {
    if (isGuest) {
      router.push(`/sign-in?next=${encodeURIComponent(pathname)}`)
      return
    }

    setOpen((prev) => !prev)
  }

  function handleClose() {
    setOpen(false)
    onClose?.()
  }

  return (
    <div className="space-y-2">
      {!hideTrigger ? (
        <button
          type="button"
          onClick={handleClick}
          className="px-0 py-1 text-xs text-zinc-500 hover:text-white"
        >
          {open ? "Cancel report" : "Report"}
        </button>
      ) : null}

      {open ? (
        <form
          action={createReportAction}
          className="space-y-3 px-0 py-2"
        >
          {toReportFormHiddenFields(payload).map((field) => (
            <input
              key={field.name}
              type="hidden"
              name={field.name}
              value={field.value}
            />
          ))}

          <div className="flex justify-between items-center">
            <span className="text-sm text-white">Report</span>
            <button
              type="button"
              onClick={handleClose}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Reason</label>
            <select
              name={reportFormFieldNames.reason}
              required
              className="w-full border-b border-zinc-800 bg-black px-0 py-2 text-sm text-white outline-none"
              defaultValue=""
            >
              <option value="" disabled>
                Select reason
              </option>
              {reportReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Description</label>
            <textarea
              name={reportFormFieldNames.description}
              rows={3}
              placeholder="Add details"
              className="w-full border-b border-zinc-800 bg-black px-0 py-2 text-sm text-white outline-none"
            />
          </div>

          <button
            type="submit"
            className="px-0 py-2 text-sm font-semibold text-red-500 hover:text-red-400"
          >
            Submit report
          </button>
        </form>
      ) : null}
    </div>
  )
}
