"use client";

import { useState, useEffect } from "react";
import { Clock, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export function PayoutCountdown() {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const utcNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
      
      // Next payout is at midnight UTC
      const nextPayout = new Date(utcNow);
      nextPayout.setUTCHours(24, 0, 0, 0);
      
      // If already past midnight today, set to tomorrow
      if (nextPayout <= utcNow) {
        nextPayout.setUTCDate(nextPayout.getUTCDate() + 1);
      }

      const diff = nextPayout.getTime() - utcNow.getTime();
      
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return null;

  const isUrgent = timeLeft.hours < 2;
  const isVeryUrgent = timeLeft.hours < 1;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
        isVeryUrgent
          ? "bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse"
          : isUrgent
          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
          : "bg-purple-500/20 text-purple-400 border border-purple-500/50"
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Payout dans</span>
      <span className="tabular-nums">
        {String(timeLeft.hours).padStart(2, "0")}h{" "}
        {String(timeLeft.minutes).padStart(2, "0")}m{" "}
        {String(timeLeft.seconds).padStart(2, "0")}s
      </span>
      <Coins className="h-3.5 w-3.5 ml-1" />
    </div>
  );
}

