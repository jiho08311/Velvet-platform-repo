"use client"

import { useMemo, useState } from "react"

type MessageComposerSendData = {
  content: string
  type: "text"
  files: File[]
}

type MessageComposerClassNames = {
  textarea: string
  fileInput: string
  submitButton: string
}

export function MessageComposer({
  onSend,
  classNames,
}: {
  onSend: (data: MessageComposerSendData) => void | Promise<void>
  classNames: MessageComposerClassNames
}) {
  const [content, setContent] = useState("")
  const [files, setFiles] = useState<File[]>([])

  const previews = useMemo(() => {
    return files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      kind: file.type.startsWith("video/") ? "video" : "image",
    }))
  }, [files])

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? [])
    setFiles(selectedFiles)
  }

  function handleRemoveFile(targetIndex: number) {
    setFiles((current) => current.filter((_, index) => index !== targetIndex))
  }

  async function handleSend() {
    await onSend({
      content,
      type: "text",
      files,
    })

    setContent("")
    setFiles([])
  }

  return (
    <div className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={classNames.textarea}
        placeholder="메시지를 입력하세요..."
      />

      <div className="space-y-2">
        <label className="block">
          <span className="mb-2 block text-xs font-medium text-zinc-400">
            이미지 또는 동영상 첨부
          </span>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className={classNames.fileInput}
          />
        </label>

        {previews.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {previews.map((preview, index) => (
              <div
                key={`${preview.file.name}-${index}`}
                className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
              >
                <div className="aspect-square bg-black">
                  {preview.kind === "image" ? (
                    <img
                      src={preview.url}
                      alt={preview.file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={preview.url}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                    />
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 p-2">
                  <p className="truncate text-xs text-zinc-300">
                    {preview.file.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="shrink-0 rounded-lg bg-zinc-800 px-2 py-1 text-xs text-white"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleSend}
        className={classNames.submitButton}
      >
        전송
      </button>
    </div>
  )
}
