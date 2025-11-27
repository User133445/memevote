"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile, Flame, Skull, Brain, Zap, Gem } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ReactionCount {
  reaction_type: string;
  count: number;
  user_reacted: boolean;
}

const REACTIONS = [
  { type: "funny", icon: "😂", label: "Funny", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  { type: "fire", icon: "🔥", label: "Fire", color: "text-orange-400", bgColor: "bg-orange-500/20" },
  { type: "dead", icon: "💀", label: "Dead", color: "text-gray-400", bgColor: "bg-gray-500/20" },
  { type: "smart", icon: "🧠", label: "Smart", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  { type: "shocked", icon: "😱", label: "Shocked", color: "text-purple-400", bgColor: "bg-purple-500/20" },
  { type: "diamond", icon: "💎", label: "Diamond", color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
];

export function MemeReactions({ memeId }: { memeId: string }) {
  const [reactions, setReactions] = useState<ReactionCount[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (memeId && supabase) {
      fetchReactions();
    }
  }, [memeId, supabase]);

  const fetchReactions = async () => {
    if (!supabase) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;

      // Get reaction counts
      const { data: reactionData } = await supabase
        .from("meme_reactions")
        .select("reaction_type")
        .eq("meme_id", memeId);

      if (reactionData) {
        // Count reactions by type
        const counts: Record<string, number> = {};
        const userReactions = new Set<string>();

        reactionData.forEach((r: any) => {
          counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
          if (userId && r.user_id === userId) {
            userReactions.add(r.reaction_type);
          }
        });

        // Build reaction array
        const reactionArray: ReactionCount[] = REACTIONS.map((r) => ({
          reaction_type: r.type,
          count: counts[r.type] || 0,
          user_reacted: userReactions.has(r.type),
        }));

        setReactions(reactionArray);
      }
    } catch (error) {
      console.error("Error fetching reactions:", error);
    }
  };

  const handleReaction = async (reactionType: string) => {
    if (!connected || !publicKey || !supabase) {
      toast({
        title: "Connexion requise",
        description: "Connectez votre wallet pour réagir",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const existingReaction = reactions.find(
        (r) => r.reaction_type === reactionType && r.user_reacted
      );

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from("meme_reactions")
          .delete()
          .eq("meme_id", memeId)
          .eq("user_id", user.user.id)
          .eq("reaction_type", reactionType);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase.from("meme_reactions").insert({
          meme_id: memeId,
          user_id: user.user.id,
          reaction_type: reactionType,
        });

        if (error) throw error;
      }

      fetchReactions();
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d&apos;ajouter la réaction",
        variant: "destructive",
      });
    }
  };

  const topReactions = reactions
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div className="flex items-center gap-2">
      {/* Top Reactions Display */}
      {topReactions.length > 0 && (
        <div className="flex items-center gap-1">
          {topReactions.map((reaction) => {
            const reactionConfig = REACTIONS.find((r) => r.type === reaction.reaction_type);
            if (!reactionConfig) return null;

            return (
              <Button
                key={reaction.reaction_type}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-2 gap-1 text-xs",
                  reaction.user_reacted && reactionConfig.bgColor
                )}
                onClick={() => handleReaction(reaction.reaction_type)}
              >
                <span className="text-base">{reactionConfig.icon}</span>
                <span>{formatNumber(reaction.count)}</span>
              </Button>
            );
          })}
        </div>
      )}

      {/* Reaction Picker */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
            <Smile className="h-4 w-4" />
            <span className="text-xs">Réagir</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="glass-effect border-purple-500/20 bg-black/95 w-auto p-2">
          <div className="grid grid-cols-3 gap-2">
            {REACTIONS.map((reaction) => {
              const reactionData = reactions.find((r) => r.reaction_type === reaction.type);
              const isActive = reactionData?.user_reacted || false;

              return (
                <Button
                  key={reaction.type}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-12 w-12 flex-col gap-1",
                    isActive && reaction.bgColor
                  )}
                  onClick={() => handleReaction(reaction.type)}
                >
                  <span className="text-2xl">{reaction.icon}</span>
                  <span className="text-xs">{reaction.label}</span>
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

