"use client";

import { useEffect, useState } from "react";
import { Trophy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeUnlockProps {
  trigger: boolean;
  badgeName: string;
  badgeIcon: string;
  onComplete?: () => void;
}

export function BadgeUnlock({ trigger, badgeName, badgeIcon, onComplete }: BadgeUnlockProps) {
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
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-3xl opacity-50 animate-pulse" />
        
        {/* Main content */}
        <div className="relative bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border-2 border-yellow-400/50 rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="text-8xl animate-bounce">{badgeIcon}</div>
              <Sparkles className="h-12 w-12 text-yellow-300 absolute -top-2 -right-2 animate-spin-slow" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-300 mb-2">
                Badge Débloqué!
              </div>
              <div className="text-xl font-semibold text-white">
                {badgeName}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

