"use client";

import { useRef, useEffect } from "react";

interface UseSwipeGesturesOptions {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useSwipeGestures({
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
}: UseSwipeGesturesOptions) {
  const elementRef = useRef<HTMLElement | null>(null);
  const startY = useRef<number | null>(null);
  const currentY = useRef<number | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      startY.current = e.touches[0].clientY;
      currentY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      currentY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      if (startY.current === null || currentY.current === null) return;

      const diff = startY.current - currentY.current;

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          // Swipe up
          onSwipeUp?.();
        } else {
          // Swipe down
          onSwipeDown?.();
        }
      }

      startY.current = null;
      currentY.current = null;
    };

    element.addEventListener("touchstart", handleTouchStart);
    element.addEventListener("touchmove", handleTouchMove);
    element.addEventListener("touchend", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onSwipeUp, onSwipeDown, threshold]);

  return elementRef;
}

