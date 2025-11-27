"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@solana/wallet-adapter-react";
import { useToast } from "@/hooks/use-toast";
import { Swords, Coins, Users, Clock } from "lucide-react";
import Image from "next/image";
import { VoteButtons } from "@/components/meme/vote-buttons";

export default function BattlesPage() {
  const [battles, setBattles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchBattles();
    
    // Subscribe to real-time updates
    if (!supabase) return;

    const channel = supabase
      .channel("battles")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "battles",
        },
        () => {
          fetchBattles();
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  const fetchBattles = async () => {
    try {
      if (!supabase) {
        setBattles([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("battles")
        .select(`
          *,
          meme1:memes!battles_meme1_id_fkey(*, profiles:user_id(username)),
          meme2:memes!battles_meme2_id_fkey(*, profiles:user_id(username))
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setBattles(data || []);
    } catch (error) {
      console.error("Error fetching battles:", error);
      setBattles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinBattle = async (battleId: string, stakeAmount: number) => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet requis",
        description: "Connectez votre wallet pour participer",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!supabase) {
        throw new Error("Supabase non configuré");
      }

      // In production, this would interact with Solana program
      const { error } = await supabase.from("battle_votes").insert({
        battle_id: battleId,
        user_id: publicKey.toString(),
        stake_amount: stakeAmount,
      });

      if (error) throw error;

      toast({
        title: "Participation enregistrée !",
        description: "Votre vote a été comptabilisé",
      });

      fetchBattles();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de participer",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Battles ⚔️
        </h1>
        <Button variant="neon">
          <Swords className="mr-2 h-5 w-5" />
          Créer une Battle
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : battles.length === 0 ? (
        <Card className="glass-effect">
          <CardContent className="py-12 text-center">
            <Swords className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucune battle active. Créez-en une !
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {battles.map((battle) => {
            const meme1 = battle.meme1;
            const meme2 = battle.meme2;
            const isActive = battle.status === "active";

            return (
              <Card key={battle.id} className="glass-effect">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Swords className="h-5 w-5 text-purple-400" />
                      Battle #{battle.id.slice(0, 8)}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-yellow-400" />
                        {battle.pot_amount || 0} $VOTE
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-blue-400" />
                        {battle.battle_votes?.length || 0} participants
                      </div>
                      {isActive && (
                        <div className="flex items-center gap-1 text-red-400">
                          <Clock className="h-4 w-4" />
                          En cours
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Meme 1 */}
                    <div className="space-y-4">
                      <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black">
                        {meme1?.file_url && (
                          <Image
                            src={meme1.file_url}
                            alt={meme1.title}
                            fill
                            className="object-contain"
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">{meme1?.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          par {meme1?.profiles?.username || "Anonyme"}
                        </p>
                        {isActive && (
                          <VoteButtons
                            memeId={meme1.id}
                            initialScore={meme1?.score || 0}
                          />
                        )}
                      </div>
                    </div>

                    {/* VS */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="bg-cyber-darker rounded-full p-4 border-2 border-purple-500">
                        <Swords className="h-8 w-8 text-purple-400" />
                      </div>
                    </div>

                    {/* Meme 2 */}
                    <div className="space-y-4">
                      <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black">
                        {meme2?.file_url && (
                          <Image
                            src={meme2.file_url}
                            alt={meme2.title}
                            fill
                            className="object-contain"
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">{meme2?.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          par {meme2?.profiles?.username || "Anonyme"}
                        </p>
                        {isActive && (
                          <VoteButtons
                            memeId={meme2.id}
                            initialScore={meme2?.score || 0}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <div className="mt-6 pt-6 border-t border-purple-500/20">
                      <Button
                        onClick={() => handleJoinBattle(battle.id, 10)}
                        className="w-full"
                        variant="neon"
                      >
                        <Coins className="mr-2 h-5 w-5" />
                        Participer (10 $VOTE)
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

