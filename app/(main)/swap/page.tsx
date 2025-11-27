"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SwapForm } from "@/components/swap/swap-form";

export default function SwapPage() {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Swap de Tokens 💱
      </h1>

      {connected && publicKey ? (
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Échanger des Tokens
            </CardTitle>
            <CardDescription>
              Utilisez Jupiter pour échanger SOL/USDC contre $VOTE
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SwapForm />
            <div className="mt-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-xs text-muted-foreground">
                💡 Fee de plateforme : 1% sur chaque swap
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-effect">
          <CardContent className="py-12 text-center">
            <Coins className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Connectez votre wallet pour échanger des tokens
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

