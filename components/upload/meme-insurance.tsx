"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

interface MemeInsuranceProps {
  memeId: string;
  onInsuranceSelected: (insured: boolean, percentage: number) => void;
}

export function MemeInsurance({ memeId, onInsuranceSelected }: MemeInsuranceProps) {
  const [insured, setInsured] = useState(false);
  const [insurancePercentage] = useState(10);
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const supabase = createClient();

  const handleInsuranceToggle = async (checked: boolean) => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet requis",
        description: "Connectez votre wallet pour assurer votre meme",
        variant: "destructive",
      });
      return;
    }

    setInsured(checked);
    onInsuranceSelected(checked, insurancePercentage);

    if (checked) {
      // Calculate insurance cost (10% of estimated reward)
      const estimatedReward = 1000; // TODO: Calculate based on meme potential
      const insuranceCost = estimatedReward * (insurancePercentage / 100);
      const guaranteedMinimum = estimatedReward * 0.5; // 50% guaranteed

      try {
        if (!supabase) {
          throw new Error("Supabase non configuré");
        }

        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        // Create insurance record
        await supabase
          .from("meme_insurance")
          .insert({
            meme_id: memeId,
            user_id: user.user.id,
            insurance_amount: insuranceCost,
            insurance_percentage: insurancePercentage,
            guaranteed_minimum: guaranteedMinimum,
            status: "active",
          });

        toast({
          title: "Meme assuré !",
          description: `Votre meme est assuré à ${insurancePercentage}% - Minimum garanti: ${guaranteedMinimum.toFixed(2)} $VOTE`,
        });
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error.message || "Impossible d&apos;assurer le meme",
          variant: "destructive",
        });
        setInsured(false);
      }
    }
  };

  return (
    <Card className="glass-effect border-blue-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-400" />
          Meme Insurance
        </CardTitle>
        <CardDescription>
          Protégez votre meme contre un flop - Remboursement garanti si score &lt; 50
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="insurance"
            checked={insured}
            onCheckedChange={handleInsuranceToggle}
          />
          <Label htmlFor="insurance" className="cursor-pointer">
            <div>
              <p className="font-medium">Assurer mon meme ({insurancePercentage}%)</p>
              <p className="text-xs text-muted-foreground">
                Coût: 10% de la récompense estimée | Minimum garanti: 50% si flop
              </p>
            </div>
          </Label>
        </div>

        {insured && (
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Meme assuré</p>
                <p className="text-xs text-muted-foreground">
                  Si votre meme obtient un score &lt; 50, vous recevrez automatiquement 50% de la récompense minimale garantie.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Comment ça marche :</strong> Payez 10% de la récompense estimée. Si votre meme flop (score &lt; 50), vous recevez automatiquement 50% de la récompense minimale. Risque zéro !
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
