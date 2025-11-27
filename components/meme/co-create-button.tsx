"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CoCreateButtonProps {
  memeId: string;
  isCollaborative: boolean;
}

export function CoCreateButton({ memeId, isCollaborative }: CoCreateButtonProps) {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  if (process.env.NEXT_PUBLIC_ENABLE_CO_CREATE !== "true") {
    return null;
  }

  const handleEnableCoCreate = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet non connecté",
        description: "Veuillez connecter votre wallet.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Update meme to be collaborative
      const { error: memeError } = await supabase
        .from("memes")
        .update({ is_collaborative: true })
        .eq("id", memeId);

      if (memeError) throw memeError;

      toast({
        title: "Mode Co-Create activé",
        description: "D'autres utilisateurs peuvent maintenant collaborer sur ce meme.",
      });
    } catch (error: any) {
      console.error("Error enabling co-create:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d&apos;activer le mode co-create.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCoCreate = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet non connecté",
        description: "Veuillez connecter votre wallet.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("wallet_address", publicKey.toString())
        .single();

      if (!profile) {
        throw new Error("Profil non trouvé");
      }

      // Add as collaborator
      const { error } = await supabase.from("collaborative_memes").insert({
        meme_id: memeId,
        collaborator_id: profile.id,
        role: "editor",
      });

      if (error) throw error;

      toast({
        title: "Collaboration activée",
        description: "Vous pouvez maintenant éditer ce meme.",
      });
    } catch (error: any) {
      console.error("Error joining co-create:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de rejoindre la collaboration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isCollaborative) {
    return (
      <Button
        onClick={handleJoinCoCreate}
        disabled={loading}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Users className="h-4 w-4" />
        Rejoindre la collaboration
      </Button>
    );
  }

  return (
    <Button
      onClick={handleEnableCoCreate}
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Plus className="h-4 w-4" />
      Activer Co-Create
    </Button>
  );
}

