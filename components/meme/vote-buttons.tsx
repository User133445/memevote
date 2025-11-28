"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { VoteAnimation } from "@/components/animations/vote-animation";
import { Confetti } from "@/components/animations/confetti";
import { checkVoteEligibility, getUserVoteStats } from "@/lib/voting/vote-utils";

interface VoteButtonsProps {
  memeId: string;
  initialScore: number;
}

export function VoteButtons({ memeId, initialScore }: VoteButtonsProps) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [showVoteAnimation, setShowVoteAnimation] = useState(false);
  const [voteType, setVoteType] = useState<"upvote" | "downvote">("upvote");
  const [showConfetti, setShowConfetti] = useState(false);
  const [voteStats, setVoteStats] = useState<{
    votesRemaining: number;
    votesLimit: number;
    unlimited: boolean;
    stakingTier: string | null;
  } | null>(null);
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (connected && publicKey && supabase) {
      checkUserVote();
      loadVoteStats();
    }
  }, [connected, publicKey, memeId]);

  const loadVoteStats = async () => {
    if (!supabase || !publicKey) return;
    
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const stats = await getUserVoteStats(user.user.id);
      setVoteStats({
        votesRemaining: stats.votesRemaining,
        votesLimit: stats.votesLimit,
        unlimited: stats.unlimited,
        stakingTier: stats.stakingTier,
      });
    } catch (error) {
      console.error("Error loading vote stats:", error);
    }
  };

  const checkUserVote = async () => {
    if (!supabase || !publicKey) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data } = await supabase
        .from("votes")
        .select("vote_type")
        .eq("meme_id", memeId)
        .eq("user_id", user.user.id)
        .single();

      if (data) {
        setUserVote(data.vote_type === "up" ? "up" : "down");
      }
    } catch (error) {
      // No vote yet
    }
  };

  const handleVote = async (voteType: "up" | "down") => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet requis",
        description: "Connectez votre wallet pour voter",
        variant: "destructive",
      });
      return;
    }

    if (isVoting) return;

    setIsVoting(true);

    try {
      if (!supabase) {
        throw new Error("Supabase non configuré");
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("Utilisateur non connecté");
      }

      // Anti-cheat check
      const fingerprint = localStorage.getItem("device_fingerprint") || "unknown";
      try {
        const antiCheatResponse = await fetch("/api/anti-cheat/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.user.id,
            memeId,
            voteType,
            ipAddress: null, // Will be detected server-side
            userAgent: navigator.userAgent,
            fingerprint,
          }),
        });

        const antiCheatData = await antiCheatResponse.json();

        if (!antiCheatData.allowed || antiCheatData.suspicious) {
          toast({
            title: "Vote bloqué",
            description: antiCheatData.reason || "Activité suspecte détectée",
            variant: "destructive",
          });
          setIsVoting(false);
          return;
        }
      } catch (antiCheatError) {
        // If anti-cheat fails, continue (fail open for now)
        console.error("Anti-cheat check failed:", antiCheatError);
      }

      // Check vote eligibility (with staking tier)
      const eligibility = await checkVoteEligibility(user.user.id, memeId);
      
      if (!eligibility.canVote) {
        toast({
          title: "Vote impossible",
          description: eligibility.reason || "Vous ne pouvez pas voter pour le moment",
          variant: "destructive",
        });
        setIsVoting(false);
        loadVoteStats(); // Refresh stats
        return;
      }

      // Check if already voted
      const { data: existingVote } = await supabase
        .from("votes")
        .select("*")
        .eq("meme_id", memeId)
        .eq("user_id", user.user.id)
        .single();

      let newScore = score;
      let newUserVote: "up" | "down" | null = voteType;

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote
          await supabase
            .from("votes")
            .delete()
            .eq("id", existingVote.id);

          newScore = voteType === "up" ? score - 1 : score + 1;
          newUserVote = null;
        } else {
          // Change vote
          await supabase
            .from("votes")
            .update({ vote_type: voteType })
            .eq("id", existingVote.id);

          newScore = voteType === "up" ? score + 2 : score - 2;
        }
      } else {
        // New vote
        await supabase
          .from("votes")
          .insert({
            meme_id: memeId,
            user_id: user.user.id,
            vote_type: voteType,
          });

        newScore = voteType === "up" ? score + 1 : score - 1;
      }

      // Update meme score
      await supabase
        .from("memes")
        .update({ score: newScore })
        .eq("id", memeId);

      setScore(newScore);
      setUserVote(newUserVote);

      // Show vote animation
      setVoteType(voteType === "up" ? "upvote" : "downvote");
      setShowVoteAnimation(true);

      // Show confetti if milestone reached
      if (newScore === 1000 || newScore === 5000 || newScore === 10000) {
        setShowConfetti(true);
      }

      // Check if meme entered Top 10
      checkTop10Status(newScore);

      // Refresh vote stats
      await loadVoteStats();

      const remainingText = voteStats?.unlimited 
        ? "Votes illimités" 
        : `${voteStats?.votesRemaining || 0} votes restants`;

      toast({
        title: voteType === "up" ? "Upvote !" : "Downvote !",
        description: `Score: ${newScore} • ${remainingText}`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de voter",
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };

  const checkTop10Status = async (newScore: number) => {
    if (!supabase) return;

    try {
      const { data: topMemes } = await supabase
        .from("memes")
        .select("id, score")
        .eq("status", "approved")
        .order("score", { ascending: false })
        .limit(10);

      if (topMemes) {
        const isInTop10 = topMemes.some((m: any) => m.id === memeId);
        const rank = topMemes.findIndex((m: any) => m.id === memeId) + 1;

        if (isInTop10 && rank <= 12) {
          // Send push notification (if implemented)
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("🎉 Ton meme est dans le Top 10 !", {
              body: `Ton meme est #${rank} – continue à voter pour rester dans le Top 10 !`,
              icon: "/favicon.svg",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error checking top 10:", error);
    }
  };

  return (
    <>
      <VoteAnimation 
        trigger={showVoteAnimation} 
        type={voteType}
        onComplete={() => setShowVoteAnimation(false)}
      />
      <Confetti 
        trigger={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
      <div className="flex items-center gap-2">
        <Button
        data-action="upvote"
        variant="ghost"
        size="sm"
        onClick={() => handleVote("up")}
        disabled={isVoting}
        className={cn(
          "gap-1.5 px-3 py-1.5 rounded-full transition-all",
          userVote === "up"
            ? "bg-green-500/20 text-green-400 border border-green-500/50"
            : "bg-white/10 text-white/80 hover:bg-green-500/20 hover:text-green-400"
        )}
      >
        <ThumbsUp className="h-4 w-4" />
        <span className="text-sm font-bold">{formatNumber(score > 0 ? score : 0)}</span>
      </Button>
      <Button
        data-action="downvote"
        variant="ghost"
        size="sm"
        onClick={() => handleVote("down")}
        disabled={isVoting}
        className={cn(
          "gap-1.5 px-3 py-1.5 rounded-full transition-all",
          userVote === "down"
            ? "bg-red-500/20 text-red-400 border border-red-500/50"
            : "bg-white/10 text-white/80 hover:bg-red-500/20 hover:text-red-400"
        )}
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>
      
      {/* Vote stats indicator */}
      {voteStats && connected && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
          {voteStats.unlimited ? (
            <>
              <Zap className="h-3 w-3 text-yellow-400" />
              <span>Illimité</span>
            </>
          ) : (
            <span>
              {voteStats.votesRemaining}/{voteStats.votesLimit}
            </span>
          )}
        </div>
      )}
    </div>
    </>
  );
}
