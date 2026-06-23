import type {
  StoryEditorTool,
  StoryMusic,
} from "../types"

export type StoryTool = Extract<StoryEditorTool, "text" | "music" | "filter" | "trim">
export type StoryMusicStyle = NonNullable<StoryMusic["style"]>

export const STORY_TOOL_CONTROLS: {
  tool: StoryTool
  icon: string
  label: string
}[] = [
  { tool: "music", icon: "♫", label: "오디오" },
  { tool: "text", icon: "Aa", label: "텍스트" },
  { tool: "filter", icon: "◌", label: "필터" },
  { tool: "trim", icon: "🎬", label: "영상 편집" },
]

export const MUSIC_STYLE_CONTROLS: {
  style: StoryMusicStyle
  label: string
}[] = [
  { style: "default", label: "Default" },
  { style: "minimal", label: "Minimal" },
  { style: "bold", label: "Bold" },
]

export const TEXT_COLOR_SWATCHES = [
  "#FFFFFF",
  "#000000",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
]

export const TOOL_HELP_CARD_CLASS =
  "rounded-[18px] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500"
export const TOOL_HELP_CARD_LOOSE_CLASS =
  "rounded-[18px] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-500"
export const TOOL_SHEET_ACTION_BUTTON_CLASS =
  "rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-black transition hover:bg-zinc-100"
export const TOOL_SHEET_PANEL_CLASS =
  "space-y-5 rounded-[24px] border border-zinc-200 bg-white p-5"
export const TOOL_SHEET_COMPACT_PANEL_CLASS =
  "space-y-4 rounded-[24px] border border-zinc-200 bg-white p-5"
export const TOOL_SHEET_RAISED_PANEL_CLASS =
  "space-y-5 rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm"
export const TOOL_SHEET_TRIM_PANEL_CLASS =
  "rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm"

export const FILTER_PRESETS = ["none", "warm", "cool", "mono", "vivid"] as const
export type StoryFilterPreset = (typeof FILTER_PRESETS)[number]
export const FILTER_SWIPE_THRESHOLD = 40

export function getStoryToolControlClassName(isActive: boolean) {
  return `flex h-[72px] min-w-[72px] shrink-0 flex-col items-center justify-center rounded-[22px] border px-3 transition-all ${
    isActive
      ? "border-zinc-300 bg-white text-black shadow-sm"
      : "border-zinc-200 bg-white text-black backdrop-blur-xl"
  }`
}

export function getMusicStyleControlClassName(isActive: boolean) {
  return `rounded-xl border px-3 py-2 text-xs font-medium transition ${
    isActive
      ? "border-pink-500 bg-pink-500/10 text-black"
      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
  }`
}

export function clampPosition(value: number) {
  return Math.min(0.98, Math.max(0.02, value))
}

export function getFilterStyle(preset?: string | null) {
  if (preset === "warm") {
    return { filter: "sepia(0.35) saturate(1.15) brightness(1.05)" }
  }

  if (preset === "cool") {
    return { filter: "saturate(0.9) hue-rotate(12deg) brightness(1.02)" }
  }

  if (preset === "mono") {
    return { filter: "grayscale(1) contrast(1.05)" }
  }

  if (preset === "vivid") {
    return { filter: "saturate(1.35) contrast(1.08)" }
  }

  return { filter: "none" }
}
