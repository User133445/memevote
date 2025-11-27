"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { VoteButtons } from "./vote-buttons";
import { ShareButtons } from "./share-buttons";
import { TipButton } from "./tip-button";
import { MemeReactions } from "./meme-reactions";
import { formatDate, formatNumber } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, Eye, MoreVertical, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ReactPlayer from "react-player";
import { useInView } from "react-intersection-observer";

interface MemeCardProps {
  meme: any;
}

export function MemeCard({ meme }: MemeCardProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [views, setViews] = useState(meme.views || 0);
  const [swipeDirection, setSwipeDirection] = useState<"up" | "down" | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const supabase = createClient();
  
  // Intersection observer for autoplay when in center of screen
  const { ref, inView } = useInView({
    threshold: 0.6, // 60% visible to play
  });

  // Swipe gesture handlers
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleTouchStart = (e: TouchEvent) => {
      startY.current = e.touches[0].clientY;
      setSwipeProgress(0);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      
      const currentY = e.touches[0].clientY;
      const diff = startY.current - currentY;
      const progress = Math.min(Math.abs(diff) / 100, 1);
      
      setSwipeProgress(progress);
      
      if (diff > 30) {
        setSwipeDirection("up");
      } else if (diff < -30) {
        setSwipeDirection("down");
      } else {
        setSwipeDirection(null);
      }
    };

    const handleTouchEnd = () => {
      if (swipeDirection === "up" && swipeProgress > 0.3) {
        // Trigger upvote
        const upvoteButton = card.querySelector('[data-action="upvote"]') as HTMLElement;
        if (upvoteButton) {
          upvoteButton.click();
        }
      } else if (swipeDirection === "down" && swipeProgress > 0.3) {
        // Trigger downvote
        const downvoteButton = card.querySelector('[data-action="downvote"]') as HTMLElement;
        if (downvoteButton) {
          downvoteButton.click();
        }
      }
      
      setSwipeDirection(null);
      setSwipeProgress(0);
      startY.current = null;
    };

    card.addEventListener("touchstart", handleTouchStart);
    card.addEventListener("touchmove", handleTouchMove);
    card.addEventListener("touchend", handleTouchEnd);

    return () => {
      card.removeEventListener("touchstart", handleTouchStart);
      card.removeEventListener("touchmove", handleTouchMove);
      card.removeEventListener("touchend", handleTouchEnd);
    };
  }, [swipeDirection, swipeProgress]);

  useEffect(() => {
    if (inView && meme.id) {
      // Increment view count (debounced in real app, simplified here)
      supabase
        .from("memes")
        .update({ views: (meme.views || 0) + 1 })
        .eq("id", meme.id)
        .then(() => setViews((prev: number) => prev + 1));
    }
  }, [inView, meme.id]);

  const isVideo = meme.file_type === "video";
  const isGif = meme.file_type === "gif";

  return (
    <div 
      ref={(node) => {
        if (node) {
          (cardRef as any).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as any).current = node;
        }
      }}
      className="group relative bg-black sm:rounded-3xl overflow-hidden border border-white/5 shadow-2xl transition-all duration-300 sm:hover:border-purple-500/30 touch-pan-y"
      style={{
        transform: swipeDirection === "up" 
          ? `translateY(-${swipeProgress * 20}px) rotate(${swipeProgress * 5}deg)`
          : swipeDirection === "down"
          ? `translateY(${swipeProgress * 20}px) rotate(-${swipeProgress * 5}deg)`
          : undefined,
        opacity: swipeProgress > 0 ? 1 - swipeProgress * 0.3 : 1,
      }}
    >
      {/* Swipe Indicator */}
      {swipeProgress > 0 && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className={`text-4xl font-bold transition-all ${
            swipeDirection === "up" ? "text-green-400" : "text-red-400"
          }`}>
            {swipeDirection === "up" ? "↑" : "↓"}
          </div>
        </div>
      )}
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 p-[2px]">
               <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                 {meme.profiles?.avatar_url ? (
                   <Image src={meme.profiles.avatar_url} alt={meme.profiles.username} width={40} height={40} />
                 ) : (
                   <span className="font-bold text-white">{meme.profiles?.username?.[0]?.toUpperCase() || "U"}</span>
                 )}
               </div>
            </div>
            <div>
              <Link
                href={`/profile/${meme.profiles?.wallet_address || meme.user_id}`}
                className="font-bold text-white hover:text-purple-400 transition-colors drop-shadow-md"
              >
                @{meme.profiles?.username || "anon_chad"}
              </Link>
              <p className="text-xs text-gray-300 drop-shadow-md">
                {formatDate(meme.created_at)}
              </p>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" className="text-white/80 hover:bg-white/10 rounded-full">
             <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative aspect-[9/14] bg-zinc-900 flex items-center justify-center cursor-pointer" onClick={() => setIsMuted(!isMuted)}>
        {isVideo ? (
          <>
            <ReactPlayer
              url={meme.file_url}
              playing={inView}
              loop
              muted={isMuted}
              width="100%"
              height="100%"
              className="object-cover absolute top-0 left-0"
              style={{ objectFit: "cover" }}
              playsinline
            />
            <button 
              className="absolute bottom-6 right-6 p-2 bg-black/50 rounded-full text-white/80 hover:text-white transition-colors z-20"
              onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
            >
               {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </>
        ) : (
          <div className="relative w-full h-full">
             <Image
               src={meme.file_url}
               alt={meme.title}
               fill
               className="object-contain bg-black/50 backdrop-blur-3xl"
               unoptimized={isGif}
             />
             {/* Blurred background effect for non-filling images */}
             <Image
               src={meme.file_url}
               alt="background"
               fill
               className="object-cover blur-3xl opacity-30 -z-10"
               unoptimized={isGif}
             />
          </div>
        )}
      </div>

      {/* Footer / Actions Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
         <div className="mb-4">
           <h3 className="font-bold text-lg text-white drop-shadow-md mb-1">{meme.title}</h3>
           {meme.description && (
             <p className="text-sm text-gray-200 line-clamp-2 drop-shadow-md mb-2">
               {meme.description}
             </p>
           )}
           {meme.category && (
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/30 text-purple-200 backdrop-blur-sm border border-purple-500/20">
               #{meme.category}
             </span>
           )}
         </div>

         <div className="flex items-center justify-between">
           {/* Left: Stats */}
           <div className="flex items-center gap-4 text-white/80 text-sm font-medium">
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Eye className="h-4 w-4 text-blue-400" />
                {formatNumber(views)}
              </div>
           </div>

           {/* Right: Actions */}
           <div className="flex items-center gap-2 flex-wrap">
              <VoteButtons memeId={meme.id} initialScore={meme.score || 0} />
              <MemeReactions memeId={meme.id} />
              <TipButton 
                memeId={meme.id} 
                creatorWallet={meme.profiles?.wallet_address || meme.user_id}
                creatorId={meme.user_id}
              />
              <ShareButtons meme={meme} />
           </div>
         </div>
      </div>
    </div>
  );
}
