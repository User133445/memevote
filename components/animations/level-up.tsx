"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface LevelUpProps {
  trigger: boolean;
  level: number;
  onComplete?: () => void;
}

export function LevelUp({ trigger, level, onComplete }: LevelUpProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-50 animate-pulse" />
        
        {/* Main content */}
        <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Sparkles className="h-16 w-16 text-yellow-300 animate-spin-slow" />
              <TrendingUp className="h-8 w-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2 animate-bounce">
                Level Up!
              </div>
              <div className="text-6xl font-black text-yellow-300 animate-pulse">
                {level}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

