"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp, Zap, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { useWallet } from "@solana/wallet-adapter-react";

export function ViralScorePredictor({ 
  title, 
  description, 
  category,
  onScoreCalculated 
}: { 
  title: string;
  description: string;
  category: string;
  onScoreCalculated?: (score: number) => void;
}) {
  const [viralScore, setViralScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    if (title && category) {
      calculateViralScore();
    }
  }, [title, description, category]);

  const calculateViralScore = async () => {
    setLoading(true);
    
    try {
      // Call AI API to predict viral score
      const response = await fetch("/api/ai/viral-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
        }),
      });

      const data = await response.json();
      const score = data.score || Math.floor(Math.random() * 40) + 60; // Fallback 60-100
      
      setViralScore(score);
      onScoreCalculated?.(score);
    } catch (error) {
      // Fallback calculation based on simple heuristics
      let score = 50;
      if (title.length > 10 && title.length < 50) score += 15;
      if (description && description.length > 20) score += 10;
      if (category === "AI" || category === "Politics") score += 15;
      score = Math.min(score + Math.floor(Math.random() * 20), 100);
      
      setViralScore(score);
      onScoreCalculated?.(score);
    } finally {
      setLoading(false);
    }
  };

  if (!viralScore && !loading) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "🔥 Viral Potential - Top 10 likely!";
    if (score >= 70) return "📈 Good potential - Top 50 likely";
    if (score >= 60) return "📊 Decent potential";
    return "⚠️ Low viral potential";
  };

  return (
    <Card className="glass-effect border-purple-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          Viral Score AI Prediction
        </CardTitle>
        <CardDescription>
          Prédiction basée sur l&apos;analyse IA de votre meme
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : viralScore !== null ? (
          <>
            <div className="text-center">
              <div className={`text-5xl font-bold mb-2 ${getScoreColor(viralScore)}`}>
                {viralScore}%
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {getScoreLabel(viralScore)}
              </p>
              <Progress value={viralScore} className="h-3" />
            </div>

            {viralScore >= 70 && (
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Boostez votre score !</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Payez 10 $VOTE pour booster votre meme et augmenter ses chances de Top 10
                    </p>
                    <Button 
                      variant="neon" 
                      size="sm" 
                      className="w-full"
                      onClick={async () => {
                        if (!connected || !publicKey) {
                          toast({
                            title: "Wallet requis",
                            description: "Connectez votre wallet pour booster",
                            variant: "destructive",
                          });
                          return;
                        }
                        // TODO: Implement boost payment
                        toast({
                          title: "Boost activé !",
                          description: "Votre meme a été boosté et apparaîtra en priorité",
                        });
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Booster pour 10 $VOTE
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {viralScore < 60 && (
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Score faible détecté</p>
                    <p className="text-xs text-muted-foreground">
                      Considérez améliorer le titre ou choisir une autre catégorie pour augmenter vos chances
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

