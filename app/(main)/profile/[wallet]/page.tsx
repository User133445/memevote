"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Trophy, 
  TrendingUp, 
  MessageSquare, 
  Heart, 
  Eye, 
  Coins,
  Users,
  Settings,
  Sparkles,
  Send,
  Share2,
  MoreVertical,
  X
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MemeCard } from "@/components/meme/meme-card";
import { formatNumber } from "@/lib/utils";
import { StreakSection } from "@/components/profile/streak-section";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  wallet_address: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  points: number;
  level: number;
  badge: string;
  streak_days: number;
  total_earnings: number;
  followers_count: number;
  following_count: number;
  created_at: string;
}

export default function ProfilePage() {
  const params = useParams();
  const wallet = params.wallet as string;
  const { publicKey } = useWallet();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memes, setMemes] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("memes");
  const supabase = createClient();
  const { toast } = useToast();
  const isOwnProfile = publicKey?.toString() === wallet;

  useEffect(() => {
    if (wallet && supabase) {
      fetchProfile();
      checkFollowing();
    }
  }, [wallet, supabase, publicKey]);

  useEffect(() => {
    if (profile && supabase) {
      if (activeTab === "memes") fetchMemes();
      if (activeTab === "followers") fetchFollowers();
      if (activeTab === "following") fetchFollowing();
    }
  }, [profile, activeTab, supabase]);

  const fetchProfile = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", wallet)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemes = async () => {
    if (!supabase || !profile) return;
    
    try {
      const { data, error } = await supabase
        .from("memes")
        .select("*")
        .eq("user_id", profile.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setMemes(data || []);
    } catch (error) {
      console.error("Error fetching memes:", error);
    }
  };

  const fetchFollowers = async () => {
    if (!supabase || !profile) return;
    
    try {
      const { data, error } = await supabase
        .from("followers")
        .select("follower_id, profiles!followers_follower_id_fkey(*)")
        .eq("following_id", profile.id)
        .limit(50);

      if (error) throw error;
      setFollowers(data || []);
    } catch (error) {
      console.error("Error fetching followers:", error);
    }
  };

  const fetchFollowing = async () => {
    if (!supabase || !profile) return;
    
    try {
      const { data, error } = await supabase
        .from("followers")
        .select("following_id, profiles!followers_following_id_fkey(*)")
        .eq("follower_id", profile.id)
        .limit(50);

      if (error) throw error;
      setFollowing(data || []);
    } catch (error) {
      console.error("Error fetching following:", error);
    }
  };

  const checkFollowing = async () => {
    if (!supabase || !publicKey || !profile) return;
    
    try {
      const { data, error } = await supabase
        .from("followers")
        .select("*")
        .eq("follower_id", publicKey.toString())
        .eq("following_id", profile.id)
        .single();

      setIsFollowing(!!data && !error);
    } catch (error) {
      setIsFollowing(false);
    }
  };

  const handleFollow = async () => {
    if (!supabase || !publicKey || !profile) return;
    
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", publicKey.toString())
          .eq("following_id", profile.id);

        if (error) throw error;
        setIsFollowing(false);
      } else {
        const { error } = await supabase
          .from("followers")
          .insert({
            follower_id: publicKey.toString(),
            following_id: profile.id,
          });

        if (error) throw error;
        setIsFollowing(true);
      }
      
      await fetchProfile();
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Profil non trouvé</div>
      </div>
    );
  }

  const badgeColors: Record<string, string> = {
    Bronze: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Silver: "bg-gray-400/20 text-gray-300 border-gray-400/30",
    Gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header */}
      <Card className="border-purple-500/20 mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} className="w-full h-full rounded-full" />
                ) : (
                  <User className="h-12 w-12" />
                )}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl font-bold">{profile.username}</h1>
                    {profile.badge === "Gold" && (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        KOL
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-2 font-mono text-sm">
                    {wallet.slice(0, 5)}...{wallet.slice(-4)}
                  </p>
                  <p className="text-muted-foreground mb-3">{profile.bio || "No bio"}</p>
                  <div className="flex items-center gap-4 flex-wrap mb-4">
                    <Badge className={badgeColors[profile.badge] || badgeColors.Bronze}>
                      {profile.badge}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Level {profile.level}
                    </span>
                    {profile.streak_days > 0 && (
                      <span className="text-sm text-yellow-400 flex items-center gap-1">
                        <Sparkles className="h-4 w-4" />
                        {profile.streak_days} day streak
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isOwnProfile && (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/settings">
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  
                  {!isOwnProfile && (
                    <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{formatNumber(profile.followers_count)}</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">{formatNumber(profile.following_count)}</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {memes.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Memes created</div>
                </div>
              </div>

              {/* Action Buttons Row */}
              {!isOwnProfile && publicKey && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "neon"}
                    size="sm"
                    className="flex-1"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.location.href = `/messages?to=${wallet}`}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.location.href = `/messages?to=${wallet}`}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `${profile.username} on MemeVote`,
                          text: `Check out ${profile.username}&apos;s profile on MemeVote!`,
                          url: `${window.location.origin}/profile/${wallet}`,
                        }).catch(() => {
                          navigator.clipboard.writeText(`${window.location.origin}/profile/${wallet}`);
                          toast({
                            title: "Link copied!",
                            description: "Profile link copied to clipboard",
                          });
                        });
                      } else {
                        navigator.clipboard.writeText(`${window.location.origin}/profile/${wallet}`);
                        toast({
                          title: "Link copied!",
                          description: "Profile link copied to clipboard",
                        });
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak Section (if own profile) */}
      {isOwnProfile && (
        <div className="mb-6">
          <StreakSection />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="memes">Memes</TabsTrigger>
          <TabsTrigger value="followers">Abonnés ({profile.followers_count})</TabsTrigger>
          <TabsTrigger value="following">Abonnements ({profile.following_count})</TabsTrigger>
        </TabsList>

        <TabsContent value="memes" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memes.map((meme) => (
              <MemeCard key={meme.id} meme={meme} />
            ))}
          </div>
          {memes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Aucun meme publié
            </div>
          )}
        </TabsContent>

        <TabsContent value="followers" className="mt-6">
          <div className="space-y-3">
            {followers.map((follower: any) => (
              <Card key={follower.follower_id} className="border-purple-500/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">
                        {follower.profiles?.username || "Utilisateur"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {follower.profiles?.wallet_address?.slice(0, 8)}...
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/profile/${follower.profiles?.wallet_address}`}>
                        Voir profil
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="following" className="mt-6">
          <div className="space-y-3">
            {following.map((follow: any) => (
              <Card key={follow.following_id} className="border-purple-500/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">
                        {follow.profiles?.username || "Utilisateur"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {follow.profiles?.wallet_address?.slice(0, 8)}...
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/profile/${follow.profiles?.wallet_address}`}>
                        Voir profil
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

