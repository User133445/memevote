"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Trophy, Award, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { BadgeUnlock } from "@/components/animations/badge-unlock";

interface BadgeData {
  id: string;
  badge_key: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_rarity: string;
  reward_amount: number;
}

interface UserBadge {
  badge_id: string;
  earned_at: string;
  badge: BadgeData;
}

interface BadgeProgress {
  badge_id: string;
  current_progress: number;
  target_progress: number;
  badge: BadgeData;
}

export function BadgeSystem({ userId }: { userId?: string }) {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBadgeUnlock, setShowBadgeUnlock] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState<BadgeData | null>(null);
  const [previousBadgeCount, setPreviousBadgeCount] = useState(0);
  const { publicKey, connected } = useWallet();
  const supabase = createClient();

  useEffect(() => {
    if (connected && publicKey && supabase) {
      fetchBadges();
    }
  }, [connected, publicKey, supabase, userId]);

  const fetchBadges = async () => {
    if (!supabase) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const targetUserId = userId || user.user.id;

      // Fetch user badges
      const { data: badges } = await supabase
        .from("user_badges")
        .select("badge_id, earned_at, badge:badges(*)")
        .eq("user_id", targetUserId)
        .order("earned_at", { ascending: false });

      if (badges) {
        const newBadges = badges as UserBadge[];
        setUserBadges(newBadges);
        
        // Check if new badge was unlocked
        if (newBadges.length > previousBadgeCount && previousBadgeCount > 0) {
          const newBadge = newBadges[newBadges.length - 1];
          if (newBadge?.badge) {
            setUnlockedBadge(newBadge.badge);
            setShowBadgeUnlock(true);
          }
        }
        setPreviousBadgeCount(newBadges.length);
      }

      // Fetch badge progress
      const { data: progress } = await supabase
        .from("badge_progress")
        .select("badge_id, current_progress, target_progress, badge:badges(*)")
        .eq("user_id", targetUserId);

      if (progress) {
        setBadgeProgress(progress as BadgeProgress[]);
      }

      // Fetch all available badges
      const { data: all } = await supabase
        .from("badges")
        .select("*")
        .eq("is_active", true)
        .order("badge_rarity", { ascending: false });

      if (all) {
        setAllBadges(all as BadgeData[]);
      }
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "from-yellow-400 to-orange-500";
      case "epic":
        return "from-purple-400 to-pink-500";
      case "rare":
        return "from-blue-400 to-cyan-500";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "epic":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "rare":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const earnedBadgeIds = new Set(userBadges.map((b) => b.badge_id));

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <>
      {unlockedBadge && (
        <BadgeUnlock
          trigger={showBadgeUnlock}
          badgeName={unlockedBadge.badge_name}
          badgeIcon={unlockedBadge.badge_icon}
          onComplete={() => {
            setShowBadgeUnlock(false);
            setUnlockedBadge(null);
          }}
        />
      )}
      <div className="space-y-6">
      {/* Earned Badges */}
      {userBadges.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Badges Obtenus ({userBadges.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {userBadges.map((userBadge) => (
              <Card
                key={userBadge.badge_id}
                className={cn(
                  "glass-effect border-2 p-4 text-center hover:scale-105 transition-transform cursor-pointer",
                  getRarityBadge(userBadge.badge.badge_rarity)
                )}
              >
                <div className="text-4xl mb-2">{userBadge.badge.badge_icon}</div>
                <div className="text-sm font-bold">{userBadge.badge.badge_name}</div>
                <Badge className={cn("mt-2 text-xs", getRarityBadge(userBadge.badge.badge_rarity))}>
                  {userBadge.badge.badge_rarity}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Badge Progress */}
      {badgeProgress.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-400" />
            En Cours ({badgeProgress.length})
          </h3>
          <div className="space-y-3">
            {badgeProgress.map((progress) => {
              const percentage = Math.min((progress.current_progress / progress.target_progress) * 100, 100);
              const isCompleted = progress.current_progress >= progress.target_progress;

              return (
                <Card
                  key={progress.badge_id}
                  className={cn(
                    "glass-effect border-purple-500/20",
                    isCompleted && "border-green-500/50 bg-green-500/5"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{progress.badge.badge_icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-bold">{progress.badge.badge_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {progress.badge.badge_description}
                            </div>
                          </div>
                          <Badge className={cn(getRarityBadge(progress.badge.badge_rarity))}>
                            {progress.badge.badge_rarity}
                          </Badge>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-1">
                          {progress.current_progress} / {progress.target_progress}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All Available Badges */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Crown className="h-5 w-5 text-pink-400" />
          Tous les Badges ({allBadges.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allBadges.map((badge) => {
            const isEarned = earnedBadgeIds.has(badge.id);
            return (
              <Card
                key={badge.id}
                className={cn(
                  "glass-effect border-purple-500/20 transition-all",
                  isEarned && "border-green-500/50 bg-green-500/5",
                  !isEarned && "opacity-60"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{badge.badge_icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold">{badge.badge_name}</div>
                        {isEarned && (
                          <Sparkles className="h-4 w-4 text-yellow-400" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {badge.badge_description}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs", getRarityBadge(badge.badge_rarity))}>
                          {badge.badge_rarity}
                        </Badge>
                        {badge.reward_amount > 0 && (
                          <span className="text-xs text-purple-400">
                            +{badge.reward_amount} $VOTE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
    </>
  );
}

