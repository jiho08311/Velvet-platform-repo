"use client";

import { useEffect, useRef, useState } from "react";

type StoryVideoTrimFieldProps = {
  file: File | null;
  onChange: (value: {
    duration: number;
    requiresTrim: boolean;
    startTime: number;
    endTime: number;
  }) => void;
};

const MAX_STORY_VIDEO_SECONDS = 10;
const MIN_RANGE = 1;

export function StoryVideoTrimField({
  file,
  onChange,
}: StoryVideoTrimFieldProps) {
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragTypeRef = useRef<"start" | "end" | "move" | null>(null);
  const startXRef = useRef(0);
  const initialStartRef = useRef(0);
  const initialEndRef = useRef(0);

  useEffect(() => {
    if (!file || !file.type.startsWith("video/")) {
      setDuration(0);
      setStartTime(0);
      setEndTime(0);
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
      setEndTime(Math.min(nextDuration, MAX_STORY_VIDEO_SECONDS));
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  useEffect(() => {
    onChange({
      duration,
      requiresTrim: duration > MAX_STORY_VIDEO_SECONDS,
      startTime,
      endTime,
    });
  }, [duration, startTime, endTime, onChange]);

  if (!file || !file.type.startsWith("video/")) {
    return null;
  }

  if (!duration) {
    return null;
  }

  if (duration <= MAX_STORY_VIDEO_SECONDS) {
    return (
      <div className="text-sm text-zinc-400">
        {duration.toFixed(1)}초 (trim 필요 없음)
      </div>
    );
  }

  const percentStart = (startTime / duration) * 100;
  const percentEnd = (endTime / duration) * 100;

  function updateRange(clientX: number) {
    if (!containerRef.current || !dragTypeRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = clientX - startXRef.current;
    const deltaTime = (dx / rect.width) * duration;

    let newStart = initialStartRef.current;
    let newEnd = initialEndRef.current;

    if (dragTypeRef.current === "start") {
      newStart = Math.min(
        initialStartRef.current + deltaTime,
        newEnd - MIN_RANGE
      );

      if (newEnd - newStart > MAX_STORY_VIDEO_SECONDS) {
        newStart = newEnd - MAX_STORY_VIDEO_SECONDS;
      }
    }

    if (dragTypeRef.current === "end") {
      newEnd = Math.max(
        initialEndRef.current + deltaTime,
        newStart + MIN_RANGE
      );

      if (newEnd - newStart > MAX_STORY_VIDEO_SECONDS) {
        newEnd = newStart + MAX_STORY_VIDEO_SECONDS;
      }
    }

    if (dragTypeRef.current === "move") {
      const range = initialEndRef.current - initialStartRef.current;

      newStart = initialStartRef.current + deltaTime;
      newEnd = initialEndRef.current + deltaTime;

      if (newStart < 0) {
        newStart = 0;
        newEnd = range;
      }

      if (newEnd > duration) {
        newEnd = duration;
        newStart = duration - range;
      }
    }

    setStartTime(Math.max(0, newStart));
    setEndTime(Math.min(duration, newEnd));
  }

  function startDrag(type: "start" | "end" | "move", clientX: number) {
    dragTypeRef.current = type;
    startXRef.current = clientX;
    initialStartRef.current = startTime;
    initialEndRef.current = endTime;
  }

  function endDrag() {
    dragTypeRef.current = null;
  }

  function handleMouseDown(
    type: "start" | "end" | "move",
    event: React.MouseEvent
  ) {
    event.preventDefault();
    startDrag(type, event.clientX);

    function handleMouseMove(moveEvent: MouseEvent) {
      updateRange(moveEvent.clientX);
    }

    function handleMouseUp() {
      endDrag();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleTouchStart(
    type: "start" | "end" | "move",
    event: React.TouchEvent
  ) {
    const touch = event.touches[0];
    if (!touch) return;

    event.preventDefault();
    startDrag(type, touch.clientX);

    function handleTouchMove(moveEvent: TouchEvent) {
      const nextTouch = moveEvent.touches[0];
      if (!nextTouch) return;

      moveEvent.preventDefault();
      updateRange(nextTouch.clientX);
    }

    function handleTouchEnd() {
      endDrag();
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    }

    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm text-white">스토리 구간 선택</p>
        <p className="text-sm text-zinc-400">
          양쪽 핸들로 구간을 조절하세요. 최대 10초까지 선택 가능합니다.
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative h-3 w-full rounded-full bg-zinc-700 touch-none"
      >
        <div
          className="absolute top-0 h-full rounded-full bg-pink-500"
          style={{
            left: `${percentStart}%`,
            width: `${percentEnd - percentStart}%`,
          }}
          onMouseDown={(e) => handleMouseDown("move", e)}
          onTouchStart={(e) => handleTouchStart("move", e)}
        />

        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-300 bg-white shadow"
          style={{ left: `${percentStart}%` }}
          onMouseDown={(e) => handleMouseDown("start", e)}
          onTouchStart={(e) => handleTouchStart("start", e)}
        />

        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-300 bg-white shadow"
          style={{ left: `${percentEnd}%` }}
          onMouseDown={(e) => handleMouseDown("end", e)}
          onTouchStart={(e) => handleTouchStart("end", e)}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>시작: {startTime.toFixed(1)}초</span>
        <span>끝: {endTime.toFixed(1)}초</span>
      </div>

      <div className="text-xs text-zinc-500">
        길이: {(endTime - startTime).toFixed(1)}초 / 최대 {MAX_STORY_VIDEO_SECONDS}초
      </div>
    </div>
  );
}