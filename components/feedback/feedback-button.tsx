"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@solana/wallet-adapter-react";
import { createClient } from "@/lib/supabase/client";

const FEEDBACK_CATEGORIES = [
  { value: "bug", label: "🐛 Bug" },
  { value: "feature", label: "💡 Nouvelle fonctionnalité" },
  { value: "idea", label: "✨ Idée" },
  { value: "improvement", label: "🚀 Amélioration" },
  { value: "other", label: "📝 Autre" },
];

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [wallet, setWallet] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { publicKey, connected } = useWallet();
  const supabase = createClient();

  // Pre-fill wallet if connected
  if (connected && publicKey && !wallet) {
    setWallet(publicKey.toString());
  }

  const handleSubmit = async () => {
    if (!category || !message.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir la catégorie et le message",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (!supabase) {
        throw new Error("Supabase non configuré");
      }

      const { error } = await supabase.from("feedback").insert({
        category,
        message: message.trim(),
        email: anonymous ? null : (email || null),
        wallet_address: anonymous ? null : (wallet || null),
        anonymous,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Merci !",
        description: "Votre feedback a été envoyé. Nous l'examinerons bientôt.",
      });

      // Reset form
      setCategory("");
      setMessage("");
      setEmail("");
      setWallet("");
      setAnonymous(false);
      setIsOpen(false);
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le feedback",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 h-12 w-12 rounded-full shadow-lg shadow-purple-500/50 z-40"
        variant="outline"
        size="icon"
        title="Donner un feedback"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="glass-effect border-purple-500/20 bg-black/95 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Donner un Feedback</DialogTitle>
            <DialogDescription>
              Partagez vos idées, signalez des bugs ou suggérez des améliorations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez votre feedback..."
                className="mt-2 min-h-[120px]"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {message.length}/1000 caractères
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                Envoyer anonymement
              </Label>
            </div>

            {!anonymous && (
              <>
                <div>
                  <Label htmlFor="email">Email (optionnel)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="wallet">Wallet (optionnel)</Label>
                  <Input
                    id="wallet"
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    placeholder="Votre adresse wallet"
                    className="mt-2"
                    disabled={connected && !!publicKey}
                  />
                  {connected && publicKey && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Wallet connecté automatiquement
                    </p>
                  )}
                </div>
              </>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading || !category || !message.trim()}
              className="w-full"
              variant="neon"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Envoi..." : "Envoyer le Feedback"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

