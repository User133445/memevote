"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, Rocket, TrendingUp, Users, Coins, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const roadmapItems = [
  {
    phase: "Phase 1",
    title: "Launch & Core Features",
    status: "completed",
    date: "Mois 1",
    items: [
      "✅ Authentification Wallet (7 wallets)",
      "✅ Upload de memes (image/GIF/video)",
      "✅ Feed infini TikTok-style",
      "✅ Système de vote (upvote/downvote)",
      "✅ Leaderboard quotidien/hebdomadaire",
      "✅ Staking tiers (Chad/Diamond/Whale)",
      "✅ Premium subscription",
      "✅ Live Battles 1v1",
      "✅ NFT Minting",
      "✅ Token Swap (Jupiter)",
    ],
  },
  {
    phase: "Phase 2",
    title: "Viralité & Growth",
    status: "completed",
    date: "Mois 1-2",
    items: [
      "✅ For You page (ELO + Collaborative Filtering)",
      "✅ Social Graph (Follow System)",
      "✅ Daily Quests",
      "✅ Tipping Direct",
      "✅ On-Chain Reputation",
      "✅ Messagerie cryptée",
      "✅ Trending sections (Hot Now, Rising Stars)",
    ],
  },
  {
    phase: "Phase 3",
    title: "Monétisation Avancée",
    status: "in-progress",
    date: "Mois 2-3",
    items: [
      "🔄 Meme-to-Earn (Creator Fund)",
      "🔄 Dark Pool Voting",
      "🔄 Meme Insurance",
      "🔄 Dynamic Fee Switcher",
      "🔄 Fiat On-Ramp (MoonPay/Coinbase Pay)",
      "🔄 Buy $VOTE with Credit Card",
    ],
  },
  {
    phase: "Phase 4",
    title: "Multi-Chain & Scale",
    status: "planned",
    date: "Mois 3-6",
    items: [
      "⏳ Base Chain Enable",
      "⏳ Blast Chain Enable",
      "⏳ Cross-Chain Bridge (Wormhole)",
      "⏳ Duet/Stitch Memes",
      "⏳ Live Streaming intégré",
      "⏳ Meme Sound (Audio upload)",
    ],
  },
  {
    phase: "Phase 5",
    title: "Mobile & Global",
    status: "planned",
    date: "Mois 6-12",
    items: [
      "⏳ Mobile App (React Native)",
      "⏳ PWA optimisée",
      "⏳ Global Expansion",
      "⏳ Creator Fund (1M€ pool)",
      "⏳ AI Viral Predictions Pro",
      "⏳ Advanced Analytics Dashboard",
    ],
  },
];

export default function RoadmapPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-500 bg-clip-text text-transparent">
          🗺️ Roadmap MemeVote.fun
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Notre vision pour devenir la #1 plateforme meme mondiale en 2026
        </p>
      </div>

      <div className="space-y-8">
        {roadmapItems.map((phase, index) => (
          <Card
            key={phase.phase}
            className={`glass-effect border-purple-500/20 ${
              phase.status === "completed"
                ? "border-green-500/30 bg-green-500/5"
                : phase.status === "in-progress"
                ? "border-yellow-500/30 bg-yellow-500/5"
                : "border-purple-500/20"
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      phase.status === "completed"
                        ? "bg-green-500/20 text-green-400"
                        : phase.status === "in-progress"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-purple-500/20 text-purple-400"
                    }`}
                  >
                    {phase.status === "completed" ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : phase.status === "in-progress" ? (
                      <Clock className="h-6 w-6" />
                    ) : (
                      <Rocket className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      {phase.phase}: {phase.title}
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      {phase.date}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant={
                    phase.status === "completed"
                      ? "default"
                      : phase.status === "in-progress"
                      ? "secondary"
                      : "outline"
                  }
                  className={
                    phase.status === "completed"
                      ? "bg-green-500/20 text-green-400 border-green-500/50"
                      : phase.status === "in-progress"
                      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                      : ""
                  }
                >
                  {phase.status === "completed"
                    ? "✅ Complété"
                    : phase.status === "in-progress"
                    ? "🔄 En cours"
                    : "⏳ Planifié"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {phase.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Section */}
      <div className="mt-12 grid md:grid-cols-4 gap-4">
        <Card className="glass-effect border-purple-500/20 text-center">
          <CardContent className="p-6">
            <TrendingUp className="h-8 w-8 mx-auto text-purple-400 mb-2" />
            <div className="text-2xl font-bold">10M+</div>
            <div className="text-sm text-muted-foreground">DAU Target 2026</div>
          </CardContent>
        </Card>
        <Card className="glass-effect border-purple-500/20 text-center">
          <CardContent className="p-6">
            <Coins className="h-8 w-8 mx-auto text-yellow-400 mb-2" />
            <div className="text-2xl font-bold">600M€</div>
            <div className="text-sm text-muted-foreground">ARR Target 2026</div>
          </CardContent>
        </Card>
        <Card className="glass-effect border-purple-500/20 text-center">
          <CardContent className="p-6">
            <Users className="h-8 w-8 mx-auto text-blue-400 mb-2" />
            <div className="text-2xl font-bold">500K+</div>
            <div className="text-sm text-muted-foreground">Créateurs actifs</div>
          </CardContent>
        </Card>
        <Card className="glass-effect border-purple-500/20 text-center">
          <CardContent className="p-6">
            <Zap className="h-8 w-8 mx-auto text-pink-400 mb-2" />
            <div className="text-2xl font-bold">#1</div>
            <div className="text-sm text-muted-foreground">Plateforme Meme Globale</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

