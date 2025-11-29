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
  Twitter, 
  MessageCircle, 
  Share2, 
  Rocket,
  Sparkles,
  Trophy,
  ArrowRight
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
    rank: "Novice"
  });
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const supabase = createClient();

  // Templates de partage viraux (Anglais pour max reach)
  const shareTemplates = [
    {
      label: "Viral Launch 🚀",
      text: "Just discovered @MemeVoteFun, the first TikTok-style meme platform on #Solana! 🟣 Earn $VOTE by watching memes. Don't miss out! 👇\n\n#SolanaSummer #Memes #Airdrop",
    },
    {
      label: "Passive Income 💰",
      text: "I'm earning $VOTE tokens just by scrolling memes on MemeVote.fun! 💸 Best #SocialFi app on Solana right now. Join my squad here 👇\n\n#Solana #Crypto #PassiveIncome",
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

    // Get or create referral code
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

    // Get referrals stats
    const { data: referrals } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", user.user.id);

    if (referrals) {
      const totalEarnings = referrals.reduce((sum: number, r: any) => sum + parseFloat(r.total_earnings || 0), 0);
      const paidOut = referrals.reduce((sum: number, r: any) => sum + parseFloat(r.paid_out || 0), 0);
      
      // Calculate rank
      let rank = "Novice";
      if (referrals.length >= 50) rank = "Ambassador";
      else if (referrals.length >= 10) rank = "Influencer";
      else if (referrals.length >= 1) rank = "Scout";

      setStats({
        totalReferrals: referrals.length,
        totalEarnings,
        paidOut,
        rank
      });
    }
  };

  const referralUrl = referralCode ? getShareUrl("/welcome", referralCode) : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    toast({ title: "Lien copié ! 📋", description: "Prêt à être partagé !" });
  };

  const handleShare = (text: string) => {
    if (!referralUrl) return;
    const fullText = `${text}\n\n${referralUrl}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`;
    window.open(twitterUrl, "_blank");
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-6xl">
      <div className="text-center mb-6 sm:mb-8 md:mb-12">
        <Badge variant="outline" className="mb-3 sm:mb-4 border-purple-500 text-purple-400 px-3 sm:px-4 py-1 text-xs sm:text-sm animate-pulse">
          <Sparkles className="w-3 h-3 mr-2" /> Programme d'affiliation Live
        </Badge>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-500 bg-clip-text text-transparent px-2">
          INVITE & GAGNE
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
          Construis ton équipe, complète des quêtes sociales et gagne des commissions à vie en $VOTE et USDC.
        </p>
      </div>

      {connected && publicKey ? (
        <div className="grid lg:grid-cols-12 gap-4 sm:gap-6 md:gap-8">
          {/* Sidebar Stats - 4 cols */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6">
            <Card className="glass-effect border-purple-500/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-yellow-400" />
                  Tes Performances
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                   <div className="p-3 sm:p-4 rounded-xl bg-black/40 border border-white/5 text-center hover:border-purple-500/30 transition-colors">
                      <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Filleuls</div>
                      <div className="text-2xl sm:text-3xl font-black text-white">{stats.totalReferrals}</div>
                   </div>
                   <div className="p-3 sm:p-4 rounded-xl bg-black/40 border border-white/5 text-center hover:border-green-500/30 transition-colors">
                      <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Gagné ($VOTE)</div>
                      <div className="text-2xl sm:text-3xl font-black text-green-400">{stats.totalEarnings.toFixed(0)}</div>
                   </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-500/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-purple-300 uppercase tracking-wider">Rang Actuel</div>
                    <div className="text-xl font-bold text-purple-100">{stats.rank}</div>
                  </div>
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Ton Lien Unique</label>
                  <div className="flex gap-2">
                    <Input value={referralUrl} readOnly className="bg-black/50 font-mono text-xs h-10 border-white/10" />
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
                 <CardDescription>Connecte tes réseaux pour +500 $VOTE</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-between group hover:border-blue-400/50 bg-black/20" disabled>
                  <span className="flex items-center gap-2">
                    <Twitter className="h-4 w-4 text-blue-400" /> Connecter X
                  </span>
                  <Badge variant="secondary" className="text-xs">Bientôt</Badge>
                </Button>
                <Button variant="outline" className="w-full justify-between group hover:border-indigo-400/50 bg-black/20" disabled>
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-indigo-400" /> Rejoindre Discord
                  </span>
                   <Badge variant="secondary" className="text-xs">Bientôt</Badge>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - 8 cols */}
          <div className="lg:col-span-8 space-y-6">
             <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-900/60 to-blue-900/60 border border-white/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Coins className="w-48 h-48" />
               </div>
               <div className="relative z-10">
                 <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                   <div className="p-1.5 sm:p-2 rounded-lg bg-yellow-500/20">
                     <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
                   </div>
                   <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">10% Commission à Vie</h3>
                 </div>
                 <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-4 sm:mb-6 max-w-xl">
                   Tu gagnes 10% de TOUS les frais générés par tes filleuls. Cela inclut les frais de trading, les abonnements premium et les pots de battle.
                 </p>
                 <div className="flex items-center gap-2 text-green-400 bg-green-900/20 w-full sm:w-fit px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-green-500/30 text-xs sm:text-sm">
                   <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                   <span className="font-semibold">Paiements automatiques chaque lundi</span>
                 </div>
               </div>
             </div>

             <Card className="glass-effect border-pink-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-pink-400" />
                    Viral Templates
                  </CardTitle>
                  <CardDescription>Outils de partage en un clic. Utilise-les pour maximiser ta portée.</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  {shareTemplates.map((template, i) => (
                    <div key={i} className="p-4 sm:p-5 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/50 transition-all group flex flex-col h-full">
                      <div className="flex items-center justify-between mb-4">
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
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line flex-grow mb-4">
                        {template.text}
                      </p>
                      <div className="mt-auto pt-4 border-t border-white/5 flex justify-end">
                         <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-pink-400 transition-colors cursor-pointer" onClick={() => handleShare(template.text)}>
                           Partager maintenant <ArrowRight className="w-3 h-3" />
                         </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
             </Card>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center glass-effect rounded-3xl border border-white/10 bg-black/40">
          <div className="p-6 rounded-full bg-purple-500/20 mb-6 animate-pulse">
            <Users className="h-16 w-16 text-purple-400" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Connecte ton wallet pour commencer</h2>
          <p className="text-muted-foreground mb-8 max-w-md text-lg">
            Tu as besoin d'un wallet Solana actif pour générer ton lien de parrainage et suivre tes gains.
          </p>
          <div className="text-sm text-purple-400 animate-bounce bg-purple-900/20 px-4 py-2 rounded-full border border-purple-500/30">
            ☝️ Connecte ton wallet en haut à droite
          </div>
        </div>
      )}
    </div>
  );
}

// Helper icon component needed for the new layout
function CheckCircle2({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
