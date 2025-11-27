"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  Users, 
  Coins, 
  TrendingUp, 
  Twitter, 
  MessageCircle, 
  Share2, 
  CheckCircle2,
  Rocket,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { getShareUrl } from "@/lib/utils";

export default function ReferPage() {
  const [referralCode, setReferralCode] = useState<string>("");
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    paidOut: 0,
  });
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const supabase = createClient();

  // Templates de partage viraux (Anglais pour max reach)
  const shareTemplates = [
    {
      label: "Viral Launch 🚀",
      text: "Just discovered @MemeVoteFun, the first TikTok-style meme platform on #Solana! 🟣 Earn $VOTE by watching memes. Don&apos;t miss out! 👇\n\n#SolanaSummer #Memes #Airdrop",
    },
    {
      label: "Passive Income 💰",
      text: "I&apos;m earning $VOTE tokens just by scrolling memes on MemeVote.fun! 💸 Best #SocialFi app on Solana right now. Join my squad here 👇\n\n#Solana #Crypto #PassiveIncome",
    },
    {
      label: "Degen Style 🐸",
      text: "APE IN @MemeVoteFun! 🦍 The pump.fun of memes is here. Upload, Vote, Earn. LFG! 🔥\n\n#Memecoin #Solana #WIF #BONK",
    }
  ];

  useEffect(() => {
    if (connected && publicKey) {
      fetchReferralData();
    }
  }, [connected, publicKey]);

  const fetchReferralData = async () => {
    if (!supabase) return;

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", user.user.id)
      .single();

    if (profile?.referral_code) {
      setReferralCode(profile.referral_code);
    } else {
      const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      await supabase
        .from("profiles")
        .update({ referral_code: newCode })
        .eq("id", user.user.id);
      setReferralCode(newCode);
    }

    const { data: referrals } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", user.user.id);

    if (referrals) {
      const totalEarnings = referrals.reduce((sum: number, r: any) => sum + parseFloat(r.total_earnings || 0), 0);
      const paidOut = referrals.reduce((sum: number, r: any) => sum + parseFloat(r.paid_out || 0), 0);

      setStats({
        totalReferrals: referrals.length,
        totalEarnings,
        paidOut,
      });
    }
  };

  const referralUrl = referralCode ? getShareUrl("/welcome", referralCode) : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    toast({ title: "Link Copied! 📋", description: "Ready to shill!" });
  };

  const handleShare = (text: string) => {
    if (!referralUrl) return;
    const fullText = `${text}\n\n${referralUrl}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`;
    window.open(twitterUrl, "_blank");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-4 border-purple-500 text-purple-400 px-4 py-1 text-sm">
          <Sparkles className="w-3 h-3 mr-2" /> Social Farming Live
        </Badge>
        <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-500 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4">
          REFER & EARN
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Build your squad, complete social quests, and earn lifetime commissions in $VOTE.
        </p>
      </div>

      {connected && publicKey ? (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Column 1: Stats & Link */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass-effect border-purple-500/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-yellow-400" />
                  Your Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Referrals</div>
                      <div className="text-2xl font-black text-white">{stats.totalReferrals}</div>
                   </div>
                   <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Earned</div>
                      <div className="text-2xl font-black text-green-400">{stats.totalEarnings.toFixed(0)}</div>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Your Unique Link</label>
                  <div className="flex gap-2">
                    <Input value={referralUrl} readOnly className="bg-black/50 font-mono text-xs h-10" />
                    <Button onClick={handleCopy} size="icon" className="shrink-0 bg-purple-600 hover:bg-purple-700">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-blue-500/30">
              <CardHeader>
                 <CardTitle className="flex items-center gap-2 text-blue-400">
                   <Twitter className="h-5 w-5" />
                   Social Quests
                 </CardTitle>
                 <CardDescription>Connect socials for +500 $VOTE (Soon)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-between group hover:border-blue-400/50" disabled>
                  <span className="flex items-center gap-2">
                    <Twitter className="h-4 w-4 text-blue-400" /> Connect X
                  </span>
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </Button>
                <Button variant="outline" className="w-full justify-between group hover:border-indigo-400/50" disabled>
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-indigo-400" /> Join Discord
                  </span>
                   <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Column 2 & 3: Viral Tools */}
          <div className="lg:col-span-2 space-y-6">
             <Card className="glass-effect border-pink-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-pink-400" />
                    Viral Templates
                  </CardTitle>
                  <CardDescription>One-click shill tools. Use these to maximize your reach.</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                  {shareTemplates.map((template, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/50 transition-all group">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="bg-pink-500/10 text-pink-300 border-pink-500/20">
                          {template.label}
                        </Badge>
                        <Button 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black hover:bg-gray-200"
                          onClick={() => handleShare(template.text)}
                        >
                          <Twitter className="h-3 w-3 mr-2" /> Post
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {template.text}
                      </p>
                    </div>
                  ))}
                </CardContent>
             </Card>

             <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-white/10">
               <div className="flex items-start gap-4">
                 <div className="p-3 rounded-full bg-yellow-500/20">
                   <Coins className="h-6 w-6 text-yellow-400" />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-white mb-1">10% Lifetime Commission</h3>
                   <p className="text-muted-foreground text-sm">
                     You earn 10% of ALL fees generated by your referrals. This includes trading fees, premium subscriptions, and battle pots.
                     <br/>
                     <span className="text-green-400 font-semibold mt-2 block">Payouts are automatic every Monday.</span>
                   </p>
                 </div>
               </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-effect rounded-3xl border border-white/10">
          <div className="p-6 rounded-full bg-purple-500/20 mb-6 animate-pulse">
            <Users className="h-12 w-12 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Connect Wallet to Start Earning</h2>
          <p className="text-muted-foreground mb-8 max-w-md">
            You need an active Solana wallet to generate your referral link and track your earnings.
          </p>
          {/* Wallet Connect handled in navbar, user just needs to do it */}
          <div className="text-sm text-purple-400 animate-bounce">
            ☝️ Connect Wallet in top right corner
          </div>
        </div>
      )}
    </div>
  );
}
