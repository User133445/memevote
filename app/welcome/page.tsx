import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WalletConnect } from "@/components/wallet/wallet-connect";
import { ArrowRight, TrendingUp, Trophy, Zap, Users, Gift } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-4xl w-full text-center space-y-8">
        {/* Logo/Title */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-glow-pulse">
            MemeVote.fun
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Votez pour les meilleurs memes. Gagnez des récompenses. Devenez viral.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <WalletConnect />
          <Button asChild variant="outline" size="lg" className="text-lg">
            <Link href="/feed">
              Explorer sans wallet
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <FeatureCard
            icon={<TrendingUp className="h-8 w-8 text-purple-400" />}
            title="Devenez Viral"
            description="Partagez vos memes et montez dans les classements"
          />
          <FeatureCard
            icon={<Trophy className="h-8 w-8 text-pink-400" />}
            title="Gagnez de l'Argent"
            description="Récompenses quotidiennes en USDC et $VOTE"
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8 text-cyan-400" />}
            title="Rapide & Fun"
            description="Interface intuitive style TikTok"
          />
          <FeatureCard
            icon={<Users className="h-8 w-8 text-purple-400" />}
            title="Communauté"
            description="Rejoignez des milliers de créateurs"
          />
          <FeatureCard
            icon={<Gift className="h-8 w-8 text-pink-400" />}
            title="Récompenses Quotidiennes"
            description="Top 50 gagnent chaque jour"
          />
          <FeatureCard
            icon={<TrendingUp className="h-8 w-8 text-cyan-400" />}
            title="Staking & Premium"
            description="Boostez vos votes et vos gains"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-12">
          <StatCard value="10K+" label="Memes" />
          <StatCard value="50K+" label="Votes" />
          <StatCard value="5K+" label="Utilisateurs" />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-effect rounded-lg p-6 space-y-3 hover:scale-105 transition-transform">
      <div className="flex justify-center">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass-effect rounded-lg p-4 text-center">
      <div className="text-2xl font-bold text-purple-400">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

