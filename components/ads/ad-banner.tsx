"use client";

import { usePremium } from "@/hooks/use-premium";
import { Button } from "@/components/ui/button";
import { Crown, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface AdBannerProps {
  variant?: "top" | "inline" | "popup";
  onClose?: () => void;
}

export function AdBanner({ variant = "top", onClose }: AdBannerProps) {
  const { isPremium, isTrial, trialDaysLeft } = usePremium();
  const [showPopup, setShowPopup] = useState(false);

  // Show popup after 10 votes (if not premium)
  useEffect(() => {
    if (!isPremium && variant === "popup") {
      const voteCount = parseInt(localStorage.getItem("voteCount") || "0");
      if (voteCount >= 10 && voteCount < 11) {
        setShowPopup(true);
      }
    }
  }, [isPremium, variant]);

  // Don't show ads if premium
  if (isPremium) return null;

  if (variant === "popup" && !showPopup) return null;

  const content = (
    <div className="relative p-4 rounded-xl bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 text-center group cursor-pointer overflow-hidden">
      <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors z-10"
        >
          <X className="h-4 w-4 text-white/60" />
        </button>
      )}

      <span className="text-xs font-bold text-purple-400 border border-purple-400/50 px-1.5 py-0.5 rounded uppercase tracking-wider mb-2 inline-block">
        {isTrial ? `Essai gratuit - ${trialDaysLeft}j restants` : "Ad"}
      </span>
      
      <h3 className="text-lg font-bold text-white mb-1">
        {variant === "popup" 
          ? "🚀 Débloquez Premium - Essai gratuit 3 jours !"
          : "Want to remove ads & get 2x votes?"
        }
      </h3>
      
      <p className="text-sm text-gray-300 mb-3">
        {variant === "popup"
          ? "Votes illimités, Dark Feed exclusif, sans pub, accès anticipé aux battles"
          : "Get Premium Access & unlock unlimited votes + Dark Feed"
        }
      </p>

      <Button
        asChild
        variant="neon"
        size={variant === "popup" ? "lg" : "sm"}
        className="w-full sm:w-auto"
        onClick={() => {
          if (variant === "popup") {
            setShowPopup(false);
            localStorage.setItem("premiumPopupShown", "true");
          }
        }}
      >
        <Link href="/premium">
          <Crown className="h-4 w-4 mr-2" />
          {variant === "popup" ? "Essai gratuit 3 jours →" : "Get Premium →"}
        </Link>
      </Button>
    </div>
  );

  if (variant === "popup") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="max-w-md w-full">
          {content}
        </div>
      </div>
    );
  }

  return content;
}

