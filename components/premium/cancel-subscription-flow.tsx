"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { X, ArrowLeft, Pause, Percent, Gift, AlertCircle, CheckCircle2, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

interface CancelSubscriptionFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string;
}

export function CancelSubscriptionFlow({ open, onOpenChange, userName = "Utilisateur" }: CancelSubscriptionFlowProps) {
  const [step, setStep] = useState<"reason" | "pause" | "trial" | "discount" | "warning" | "final">("reason");
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [pauseDuration, setPauseDuration] = useState<"1" | "2" | "3">("1");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleReasonSubmit = () => {
    if (!selectedReason) {
      toast({
        title: "Raison requise",
        description: "Veuillez sélectionner une raison",
        variant: "destructive",
      });
      return;
    }

    // Si l'utilisateur choisit "Autre" ou "Je reviendrai plus tard", proposer la pause
    if (selectedReason === "later" || selectedReason === "other") {
      setStep("pause");
    } else {
      // Sinon, essayer de le retenir avec des offres
      setStep("trial");
    }
  };

  const handlePause = async () => {
    setLoading(true);
    try {
      // TODO: Implémenter la pause via Stripe API
      toast({
        title: "Abonnement mis en pause",
        description: `Votre abonnement est en pause pendant ${pauseDuration} mois`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre en pause l&apos;abonnement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrialExtension = async () => {
    setLoading(true);
    try {
      // TODO: Implémenter l'extension d'essai via Stripe API
      toast({
        title: "Essai prolongé !",
        description: "Votre essai gratuit a été prolongé de 14 jours supplémentaires",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de prolonger l&apos;essai",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDiscount = async () => {
    setLoading(true);
    try {
      // TODO: Implémenter la réduction via Stripe API
      toast({
        title: "Réduction appliquée !",
        description: "Vous bénéficiez maintenant de -67% sur 24 mois",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d&apos;appliquer la réduction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalCancel = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error("Supabase non configuré");
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Utilisateur non connecté");

      // Annuler l&apos;abonnement Stripe
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.user.id,
          reason: selectedReason,
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de l&apos;annulation");

      toast({
        title: "Abonnement annulé",
        description: "Votre abonnement VIP a été annulé avec succès",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d&apos;annuler l&apos;abonnement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-effect border-purple-500/20 sm:max-w-lg bg-black/95">
        {/* Step 1: Reason */}
        {step === "reason" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                <DialogTitle className="text-xl">
                  {userName}, encore une dernière chose avant que tu partes !
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-6 w-6"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription className="text-base">
                Quelle est la raison de l&apos;annulation ?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-4">
              <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer">
                  <RadioGroupItem value="features" id="features" />
                  <Label htmlFor="features" className="flex-1 cursor-pointer">
                    Fonctionnalités manquantes
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer">
                  <RadioGroupItem value="price" id="price" />
                  <Label htmlFor="price" className="flex-1 cursor-pointer">
                    Trop cher
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer">
                  <RadioGroupItem value="difficult" id="difficult" />
                  <Label htmlFor="difficult" className="flex-1 cursor-pointer">
                    Pas facile à utiliser
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer">
                  <RadioGroupItem value="later" id="later" />
                  <Label htmlFor="later" className="flex-1 cursor-pointer">
                    Je n&apos;en ai pas besoin maintenant. Je reviendrai plus tard
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="flex-1 cursor-pointer">
                    Autre
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleReasonSubmit}
                className="flex-1"
                variant="neon"
                disabled={!selectedReason}
              >
                Continuer
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Pause */}
        {step === "pause" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={() => setStep("reason")} />
                <DialogTitle className="text-xl">
                  Veux-tu mettre ton abonnement en pause ?
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-6 w-6"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription>
                Tu peux mettre ton abonnement en pause pendant quelque temps et revenir quand tu le souhaites. Pendant combien de temps veux-tu mettre en pause ?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-4">
              <RadioGroup value={pauseDuration} onValueChange={(v) => setPauseDuration(v as "1" | "2" | "3")}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer">
                  <RadioGroupItem value="1" id="pause1" />
                  <Label htmlFor="pause1" className="flex-1 cursor-pointer">
                    1 mois
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer">
                  <RadioGroupItem value="2" id="pause2" />
                  <Label htmlFor="pause2" className="flex-1 cursor-pointer">
                    2 mois
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer">
                  <RadioGroupItem value="3" id="pause3" />
                  <Label htmlFor="pause3" className="flex-1 cursor-pointer">
                    3 mois
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handlePause}
                className="flex-1"
                variant="neon"
                disabled={loading}
              >
                <Pause className="h-4 w-4 mr-2" />
                Suspendre l&apos;abonnement
              </Button>
              <Button
                onClick={() => setStep("warning")}
                variant="outline"
                className="flex-1"
              >
                Procéder à l&apos;annulation
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Trial Extension */}
        {step === "trial" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={() => setStep("reason")} />
                <DialogTitle className="text-xl">
                  Souhaitez-vous prolonger votre essai gratuit de 14 jours supplémentaires ?
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-6 w-6"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription>
                Pour vous permettre de tester davantage MemeVote Premium, nous souhaitons vous offrir 14 jours supplémentaires pour votre essai gratuit.
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleTrialExtension}
                className="flex-1"
                variant="neon"
                disabled={loading}
              >
                <Gift className="h-4 w-4 mr-2" />
                Oui, je souhaite obtenir 14 jours gratuits supplémentaires
              </Button>
              <Button
                onClick={() => setStep("discount")}
                variant="outline"
                className="flex-1"
              >
                Non, annuler l&apos;abonnement
              </Button>
            </div>
          </>
        )}

        {/* Step 4: Discount */}
        {step === "discount" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={() => setStep("trial")} />
                <DialogTitle className="text-xl">
                  Préférerais-tu obtenir une réduction à la place ?
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-6 w-6"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription>
                Pour ton prochain renouvellement, tu peux profiter de MemeVote Premium à un tarif réduit pendant les 24 prochains mois ! La réduction s&apos;applique au prix initial de ton abonnement.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 text-center">
              <div className="inline-block p-6 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-dashed border-blue-500/50 mb-4">
                <span className="text-4xl font-bold text-white">-67%</span>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-lg">Prix spécial pour le forfait de 24 mois !</p>
                <div className="flex items-center justify-center gap-2 text-xl">
                  <span className="line-through text-muted-foreground">€149.99</span>
                  <span>→</span>
                  <span className="text-pink-400 font-bold">€50.00</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleDiscount}
                className="flex-1"
                variant="neon"
                disabled={loading}
              >
                <Percent className="h-4 w-4 mr-2" />
                Oui, je veux obtenir une réduction
              </Button>
              <Button
                onClick={() => setStep("warning")}
                variant="outline"
                className="flex-1"
              >
                Non, annuler l&apos;abonnement
              </Button>
            </div>
          </>
        )}

        {/* Step 5: Warning */}
        {step === "warning" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={() => setStep(selectedReason === "later" || selectedReason === "other" ? "pause" : "discount")} />
                <DialogTitle className="text-xl">
                  C&apos;est triste de te voir partir !
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-6 w-6"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription>
                {userName}, tu vas perdre l&apos;accès aux fonctionnalités suivantes :
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-4">
              {[
                "Votes illimités",
                "Sans publicités",
                "Memes exclusifs",
                "Accès anticipé aux battles",
                "Badge Premium",
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <X className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => onOpenChange(false)}
                className="flex-1"
                variant="neon"
              >
                <Crown className="h-4 w-4 mr-2" />
                Fermer et conserver les fonctionnalités Premium
              </Button>
              <Button
                onClick={() => setStep("final")}
                variant="outline"
                className="flex-1"
              >
                Annuler et perdre les fonctionnalités Premium
              </Button>
            </div>
          </>
        )}

        {/* Step 6: Final Confirmation */}
        {step === "final" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl text-center">
                Confirmer l&apos;annulation
              </DialogTitle>
              <DialogDescription className="text-center">
                Êtes-vous sûr de vouloir annuler votre abonnement VIP ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleFinalCancel}
                className="flex-1"
                variant="destructive"
                disabled={loading}
              >
                {loading ? "Annulation..." : "Confirmer l&apos;annulation"}
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="flex-1"
              >
                Retour
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

