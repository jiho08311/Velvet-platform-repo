"use client"

import type {
  Dispatch,
  SetStateAction,
} from "react"
import type {
  StoryEditorState,
  StoryEditorUiState,
  StorySelectedLayer,
} from "../types"
import type {
  StoryMusicStyle,
  StoryTool,
} from "./create-story-form-model"

type StoryMusicSelection = {
  source: "external"
  trackId: string
  title: string
  artist: string
  previewUrl?: string | null
  artworkUrl?: string | null
  duration?: number | null
}

type UseStoryEditorActionsInput = {
  selectedLayer: StorySelectedLayer
  setEditorState: Dispatch<SetStateAction<StoryEditorState>>
  setUiState: Dispatch<SetStateAction<StoryEditorUiState>>
}

export function useStoryEditorActions({
  selectedLayer,
  setEditorState,
  setUiState,
}: UseStoryEditorActionsInput) {
  function closeToolSheet() {
    setUiState((prev) => ({
      ...prev,
      isToolSheetOpen: false,
    }))
  }

  function handleOpenTool(tool: StoryTool) {
    setUiState((prev) => ({
      ...prev,
      activeTool: tool,
      isToolSheetOpen: true,
    }))
  }

  function handleAddTextOverlay() {
    const nextId = crypto.randomUUID()

    setEditorState((prev) => {
      if ((prev.textOverlays?.length ?? 0) > 0) return prev

      return {
        ...prev,
        textOverlays: [
          {
            id: nextId,
            text: "",
            x: 0.5,
            y: 0.2,
            color: "#ffffff",
            fontSize: "md",
            scale: 2,
          },
        ],
      }
    })

    setUiState((prev) => ({
      ...prev,
      activeTool: "text",
      isToolSheetOpen: true,
      selectedLayer: {
        type: "text",
        id: nextId,
      },
    }))
  }

  function handleOverlayTextChange(value: string) {
    setEditorState((prev) => {
      if (selectedLayer?.type !== "text") return prev

      return {
        ...prev,
        textOverlays: (prev.textOverlays ?? []).map((overlay) =>
          overlay.id === selectedLayer.id
            ? {
                ...overlay,
                text: value,
              }
            : overlay
        ),
      }
    })
  }

  function handleChangeTextOverlayFontSize(fontSize: "sm" | "md" | "lg") {
    setEditorState((prev) => {
      if (selectedLayer?.type !== "text") return prev

      return {
        ...prev,
        textOverlays: (prev.textOverlays ?? []).map((overlay) =>
          overlay.id === selectedLayer.id
            ? {
                ...overlay,
                fontSize,
              }
            : overlay
        ),
      }
    })
  }

  function handleChangeTextOverlayColor(color: string) {
    setEditorState((prev) => {
      if (selectedLayer?.type !== "text") return prev

      return {
        ...prev,
        textOverlays: (prev.textOverlays ?? []).map((overlay) =>
          overlay.id === selectedLayer.id
            ? {
                ...overlay,
                color,
              }
            : overlay
        ),
      }
    })
  }

  function handleRemoveTextOverlay() {
    setEditorState((prev) => {
      if (selectedLayer?.type !== "text") return prev

      return {
        ...prev,
        textOverlays: (prev.textOverlays ?? []).filter(
          (overlay) => overlay.id !== selectedLayer.id
        ),
      }
    })

    setUiState((prev) => ({
      ...prev,
      selectedLayer: null,
    }))
  }

  function handleSelectMusic(option: StoryMusicSelection) {
    setEditorState((prev) => ({
      ...prev,
      music: {
        source: option.source,
        trackId: option.trackId,
        title: option.title,
        artist: option.artist,
        artworkUrl: option.artworkUrl ?? null,
        previewUrl: option.previewUrl ?? null,
        startTime: 0,
        duration: option.duration ?? 30,
        volume: 1,
        x: 0.5,
        y: 0.5,
        style: prev.music?.style ?? "default",
      },
    }))

    setUiState((prev) => ({
      ...prev,
      activeTool: "music",
      isToolSheetOpen: true,
      selectedLayer: {
        type: "music",
        id: "music",
      },
    }))
  }

  function handleChangeMusicStyle(style: StoryMusicStyle) {
    setEditorState((prev) => {
      if (!prev.music) return prev

      return {
        ...prev,
        music: {
          ...prev.music,
          style,
        },
      }
    })
  }

  function handleRemoveMusic() {
    setEditorState((prev) => ({
      ...prev,
      music: null,
    }))

    setUiState((prev) => ({
      ...prev,
      selectedLayer: null,
    }))
  }

  return {
    closeToolSheet,
    handleAddTextOverlay,
    handleChangeMusicStyle,
    handleChangeTextOverlayColor,
    handleChangeTextOverlayFontSize,
    handleOpenTool,
    handleOverlayTextChange,
    handleRemoveMusic,
    handleRemoveTextOverlay,
    handleSelectMusic,
  }
}
