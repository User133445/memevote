"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle, RefreshCw, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function ModerationPage() {
  const [memes, setMemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingMemes();
  }, []);

  const fetchPendingMemes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("memes")
        .select(`
          *,
          profiles(username, wallet_address)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(20);

      if (error) throw error;
      setMemes(data || []);
    } catch (error) {
      console.error("Error fetching memes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les memes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModeration = async (memeId: string, action: "approve" | "reject", reason?: string) => {
    setProcessing(memeId);
    try {
      const status = action === "approve" ? "approved" : "rejected";
      
      const { error } = await supabase
        .from("memes")
        .update({ 
          status,
          rejection_reason: reason || null
        })
        .eq("id", memeId);

      if (error) throw error;

      // Remove from list
      setMemes(prev => prev.filter(m => m.id !== memeId));
      
      toast({
        title: action === "approve" ? "Meme approuvé" : "Meme rejeté",
        variant: action === "approve" ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Moderation error:", error);
      toast({
        title: "Erreur",
        description: "L'action a échoué",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement de la queue de modération...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Queue de Modération</h1>
        <Button variant="outline" onClick={fetchPendingMemes}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {memes.length === 0 ? (
        <Card className="bg-zinc-900/50 border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Check className="h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Tout est propre !</h2>
            <p className="text-zinc-400">Aucun meme en attente de validation.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {memes.map((meme) => (
            <Card key={meme.id} className="bg-zinc-900 border-white/10 overflow-hidden flex flex-col">
              <div className="relative aspect-square bg-black">
                {meme.file_type === "image" || meme.file_type === "gif" ? (
                  <Image 
                    src={meme.file_url} 
                    alt={meme.title}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <video 
                      src={meme.file_url} 
                      className="w-full h-full object-contain"
                      controls
                    />
                  </div>
                )}
                {meme.is_nsfw && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded uppercase">
                    NSFW
                  </div>
                )}
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-lg mb-1 line-clamp-1">{meme.title}</h3>
                <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                  {meme.description || "Pas de description"}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
                  <span>Par: {meme.profiles?.username || "Unknown"}</span>
                  <span>•</span>
                  <span>{new Date(meme.created_at).toLocaleDateString()}</span>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2">
                  <Button 
                    variant="destructive" 
                    onClick={() => handleModeration(meme.id, "reject")}
                    disabled={processing === meme.id}
                  >
                    <X className="h-4 w-4 mr-2" /> Rejeter
                  </Button>
                  <Button 
                    variant="default" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleModeration(meme.id, "approve")}
                    disabled={processing === meme.id}
                  >
                    <Check className="h-4 w-4 mr-2" /> Approuver
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

