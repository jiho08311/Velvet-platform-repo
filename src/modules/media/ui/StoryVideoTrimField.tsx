"use client";

import { useEffect, useMemo, useState } from "react";

type StoryVideoTrimFieldProps = {
  file: File | null;
  onChange: (value: {
    duration: number;
    requiresTrim: boolean;
    startTime: number;
  }) => void;
};

const MAX_STORY_VIDEO_SECONDS = 10;

export function StoryVideoTrimField({
  file,
  onChange,
}: StoryVideoTrimFieldProps) {
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);

  useEffect(() => {
    if (!file || !file.type.startsWith("video/")) {
      setDuration(0);
      setStartTime(0);
      return;
    }

    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    video.preload = "metadata";
    video.src = objectUrl;

    const handleLoadedMetadata = () => {
      const nextDuration = Number.isFinite(video.duration) ? video.duration : 0;
      setDuration(nextDuration);
      setStartTime(0);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const requiresTrim = duration > MAX_STORY_VIDEO_SECONDS;
  const maxStartTime = useMemo(
    () => Math.max(0, duration - MAX_STORY_VIDEO_SECONDS),
    [duration]
  );

  useEffect(() => {
    onChange({
      duration,
      requiresTrim,
      startTime,
    });
  }, [duration, requiresTrim, startTime, onChange]);

  useEffect(() => {
    if (startTime > maxStartTime) {
      setStartTime(maxStartTime);
    }
  }, [maxStartTime, startTime]);

  if (!file || !file.type.startsWith("video/")) {
    return null;
  }

  if (!duration) {
    return null;
  }

  if (!requiresTrim) {
    return (
      <div className="space-y-1 text-sm text-zinc-400">
        <p>영상 길이: {duration.toFixed(1)}초</p>
        <p>10초 이하라서 기존 createStory 업로드 플로우 그대로 publish 하면 됩니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm text-white">스토리 구간 선택</p>
        <p className="text-sm text-zinc-400">
          선택 시작 시점부터 10초만 잘려서 업로드됩니다.
        </p>
      </div>

      <input
        type="range"
        min={0}
        max={maxStartTime}
        step={0.1}
        value={startTime}
        onChange={(event) => setStartTime(Number(event.target.value))}
        className="w-full"
      />

      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>시작: {startTime.toFixed(1)}초</span>
        <span>끝: {(startTime + MAX_STORY_VIDEO_SECONDS).toFixed(1)}초</span>
      </div>
    </div>
  );
}