"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoteAnimationProps {
  trigger: boolean;
  type: "upvote" | "downvote";
  onComplete?: () => void;
}

export function VoteAnimation({ trigger, type, onComplete }: VoteAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (!isVisible) return null;

  const isUpvote = type === "upvote";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div
        className={cn(
          "relative",
          isUpvote ? "text-green-400" : "text-red-400"
        )}
      >
        {/* Glow effect */}
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-2xl opacity-50 animate-pulse",
            isUpvote ? "bg-green-500" : "bg-red-500"
          )}
        />
        
        {/* Icon */}
        <div className="relative animate-in zoom-in-95 duration-300">
          {isUpvote ? (
            <ArrowUp className="h-20 w-20 animate-bounce" />
          ) : (
            <ArrowDown className="h-20 w-20 animate-bounce" />
          )}
        </div>
      </div>
    </div>
  );
}

