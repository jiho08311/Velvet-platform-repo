"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  createEmptyStoryEditorState,
  createEmptyStoryVideoTrim,
  getStoryMediaTypeFromFile,
  normalizeStoryEditorDraft,
} from "@/modules/story/mappers/story-editor-draft"
import { CreateStoryEditorCanvas } from "./CreateStoryEditorCanvas"
import { StoryToolSheet } from "./StoryToolSheet"
import { useStoryEditorActions } from "./use-story-editor-actions"
import { useStoryMusicSearch } from "./use-story-music-search"
import { useStoryPreviewInteractions } from "./use-story-preview-interactions"
import type {
  StoryEditorDraft,
  StoryEditorState,
  StoryEditorUiState,
} from "../types"

type CreateStoryFormProps = {
  isSubmitting?: boolean
  onNextStory: (input: StoryEditorDraft) => void
}

export function CreateStoryForm({
  isSubmitting = false,
  onNextStory,
}: CreateStoryFormProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const {
    isSearchingMusic,
    musicQuery,
    musicResults,
    setMusicQuery,
  } = useStoryMusicSearch()
  const [editorState, setEditorState] = useState<StoryEditorState>(
    createEmptyStoryEditorState()
  )
  const [uiState, setUiState] = useState<StoryEditorUiState>({
    activeTool: null,
    selectedLayer: null,
    isPreviewMode: false,
    isDragging: false,
    isToolSheetOpen: false,
  })

  const [trim, setTrim] = useState(createEmptyStoryVideoTrim())

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  const selectedLayer = uiState.selectedLayer

  const selectedTextOverlay =
    selectedLayer?.type === "text"
      ? (editorState.textOverlays ?? []).find(
          (overlay) => overlay.id === selectedLayer.id
        ) ?? null
      : null

  const isMusicSelected = selectedLayer?.type === "music"

  const selectedFilterPreset = editorState.filter?.preset ?? "none"
  const selectedMusic = editorState.music
  const selectedMusicStyle = selectedMusic?.style ?? "default"

  const activeTool = uiState.activeTool
  const isToolSheetOpen = uiState.isToolSheetOpen
  const {
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
  } = useStoryEditorActions({
    selectedLayer,
    setEditorState,
    setUiState,
  })
  const {
    filterSwipeOffsetX,
    filterSwipeStartXRef,
    handleFilterSwipeMove,
    handleFilterSwipeStart,
    handleMusicStickerMouseDown,
    handleMusicStickerTouchStart,
    handleSelectedLayerMouseDown,
    handleSelectedLayerTouchStart,
    previewContainerRef,
    resetFilterSwipe,
    showFilterIndicator,
  } = useStoryPreviewInteractions({
    activeTool,
    editorState,
    isDragging: uiState.isDragging,
    previewUrl,
    selectedFilterPreset,
    setEditorState,
    setUiState,
  })

function handleRemoveSelectedFile() {
  setFile(null)
  setPreviewUrl(null)

  setTrim(createEmptyStoryVideoTrim())

  setEditorState(createEmptyStoryEditorState())

  setUiState({
    activeTool: null,
    selectedLayer: null,
    isPreviewMode: false,
    isDragging: false,
    isToolSheetOpen: false,
  })

  if (fileInputRef.current) {
    fileInputRef.current.value = ""
  }
}



  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onNextStory(
      normalizeStoryEditorDraft({
        media: {
          type: getStoryMediaTypeFromFile(file),
          file,
          trim,
        },
        editorState,
      })
    )
  }

  return (
    <form className="min-h-screen bg-zinc-950" onSubmit={handleSubmit}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={(e) => {
          const nextFile = e.target.files?.[0] ?? null
          setFile(nextFile)
          setTrim(createEmptyStoryVideoTrim())
        }}
        className="hidden"
      />

      <CreateStoryEditorCanvas
        activeTool={activeTool}
        file={file}
        filterSwipeOffsetX={filterSwipeOffsetX}
        filterSwipeStartXRef={filterSwipeStartXRef}
        isDragging={uiState.isDragging}
        isMusicSelected={isMusicSelected}
        isSubmitting={isSubmitting}
        onCancel={() => router.push("/feed")}
        onClearSelectedLayer={() => {
          setUiState((prev) => ({
            ...prev,
            selectedLayer: null,
          }))
        }}
        onFilterSwipeMove={handleFilterSwipeMove}
        onFilterSwipeStart={handleFilterSwipeStart}
        onMusicStickerMouseDown={handleMusicStickerMouseDown}
        onMusicStickerTouchStart={handleMusicStickerTouchStart}
        onOpenFilePicker={() => fileInputRef.current?.click()}
        onOpenMusicTool={(event) => {
          event.stopPropagation()
          setUiState((prev) => ({
            ...prev,
            activeTool: "music",
            isToolSheetOpen: true,
            selectedLayer: {
              type: "music",
              id: "music",
            },
          }))
        }}
        onOpenTool={handleOpenTool}
        onRemoveSelectedFile={handleRemoveSelectedFile}
        onResetFilterSwipe={resetFilterSwipe}
        onSelectedLayerMouseDown={handleSelectedLayerMouseDown}
        onSelectedLayerTouchStart={handleSelectedLayerTouchStart}
        previewContainerRef={previewContainerRef}
        previewUrl={previewUrl}
        selectedFilterPreset={selectedFilterPreset}
        selectedLayer={selectedLayer}
        selectedMusic={selectedMusic}
        selectedMusicStyle={selectedMusicStyle}
        showFilterIndicator={showFilterIndicator}
        textOverlays={editorState.textOverlays}
      />

      {isToolSheetOpen ? (
        <StoryToolSheet
          activeTool={activeTool}
          file={file}
          selectedTextOverlay={selectedTextOverlay}
          selectedMusic={selectedMusic}
          selectedMusicStyle={selectedMusicStyle}
          isMusicSelected={isMusicSelected}
          musicQuery={musicQuery}
          musicResults={musicResults}
          isSearchingMusic={isSearchingMusic}
          onClose={closeToolSheet}
          onAddTextOverlay={handleAddTextOverlay}
          onRemoveTextOverlay={handleRemoveTextOverlay}
          onOverlayTextChange={handleOverlayTextChange}
          onTextOverlayColorChange={handleChangeTextOverlayColor}
          onMusicQueryChange={setMusicQuery}
          onSelectMusic={handleSelectMusic}
          onRemoveMusic={handleRemoveMusic}
          onChangeMusicStyle={handleChangeMusicStyle}
          onTrimChange={setTrim}
        />
      ) : null}
    </form>
  )
}
