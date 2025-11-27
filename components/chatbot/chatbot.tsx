"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Salut ! Je suis l'assistant MemeVote.fun 🤖\n\nJe peux t'aider avec :\n- Comment uploader un meme\n- Comment gagner des récompenses\n- Comment staker $VOTE\n- Les règles du jeu\n- Et plus encore !\n\nQue veux-tu savoir ?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      // Use OpenAI API if available, otherwise use rule-based
      const response = await generateResponse(currentInput);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Désolé, une erreur est survenue. Réessaye plus tard !",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const generateResponse = async (userInput: string): Promise<string> => {
    // Try OpenAI first if available
    if (process.env.NEXT_PUBLIC_OPENAI_ENABLED === "true") {
      try {
        const response = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userInput }),
        });

        const data = await response.json();
        if (data.response) return data.response;
      } catch (error) {
        console.error("OpenAI error, falling back to rules");
      }
    }

    // Fallback to rule-based responses
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes("upload") || lowerInput.includes("poster") || lowerInput.includes("meme")) {
      return "Pour uploader un meme :\n1. Va sur la page 'Upload'\n2. Glisse-dépose ton fichier (image/GIF/vidéo)\n3. Ajoute un titre et une catégorie\n4. Clique sur 'Uploader'\n\nTon meme sera modéré avant d'apparaître dans le feed !";
    }

    if (lowerInput.includes("récompense") || lowerInput.includes("gagner") || lowerInput.includes("argent") || lowerInput.includes("usdc")) {
      return "💰 Pour gagner des récompenses :\n\n• Votez pour les memes (1 upvote = +10 points)\n• Montez dans le classement quotidien\n• Top 50 gagnent chaque jour (Top 1 = 1500 USDC)\n• Staker $VOTE pour plus de votes et d'APR\n• Parrainez des amis (10% des fees)\n\nLes récompenses sont distribuées automatiquement chaque jour à minuit UTC !";
    }

    if (lowerInput.includes("stake") || lowerInput.includes("staker") || lowerInput.includes("tier")) {
      return "🎯 Système de Staking :\n\n• Chad : 1k $VOTE = 50 votes/jour + 20% boost\n• Diamond : 10k $VOTE = 500 votes/jour + badge\n• Whale : 100k+ $VOTE = votes illimités + 30% bonus\n\nAPR : 5-15% selon le tier\nPériode : 30 jours minimum";
    }

    if (lowerInput.includes("vote") || lowerInput.includes("voter")) {
      return "⬆️ Système de Vote :\n\n• 1 vote gratuit toutes les 5 minutes par meme\n• Plus de votes en stakant $VOTE\n• Premium = votes illimités\n• 1 upvote = +10 points utilisateur\n• Les votes déterminent le classement quotidien";
    }

    if (lowerInput.includes("parrain") || lowerInput.includes("referral") || lowerInput.includes("inviter")) {
      return "🎁 Système de Parrainage :\n\n• Va sur la page 'Parrainage'\n• Partage ton lien unique\n• Gagne 10% des fees de tes filleuls\n• Paiements hebdomadaires en $VOTE\n\nPlus tu parraines, plus tu gagnes !";
    }

    if (lowerInput.includes("premium") || lowerInput.includes("abonnement")) {
      return "👑 Premium (9.99€/mois) :\n\n✓ Votes illimités\n✓ Sans publicités\n✓ Memes exclusifs\n✓ Accès anticipé aux battles\n✓ Badge Premium\n\nVa sur la page Premium pour t'abonner !";
    }

    if (lowerInput.includes("battle") || lowerInput.includes("duel")) {
      return "⚔️ Battles :\n\n• 1v1 meme duels en direct\n• Stake $VOTE pour participer\n• Les viewers votent en temps réel\n• Le gagnant prend 80% du pot\n• Stream Twitch intégré\n\nRejoins une battle sur la page Battles !";
    }

    if (lowerInput.includes("nft") || lowerInput.includes("mint")) {
      return "🎨 NFT Minting :\n\n• Les memes gagnants peuvent être mintés en NFT\n• Mint en 1 clic via Metaplex\n• Vente dans le marketplace in-app\n• 5% de fees pour la plateforme\n\nGagne un classement pour débloquer le mint !";
    }

    if (lowerInput.includes("live") || lowerInput.includes("direct")) {
      return "🔴 Live Feed :\n\n• Voir les nouveaux memes en temps réel\n• Activités live (votes, uploads)\n• Statistiques en direct\n• Top trending memes\n\nVa sur la page Live pour voir l'action !";
    }

    return "Je ne suis pas sûr de comprendre 🤔\n\nPose-moi une question sur :\n• Upload de memes\n• Récompenses et gains\n• Staking\n• Voting\n• Parrainage\n• Premium\n• Battles\n• NFTs\n• Live feed\n\nOu tape 'aide' pour voir toutes les commandes !";
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg shadow-purple-500/50 z-50"
        variant="neon"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col glass-effect shadow-2xl z-50">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-400" />
          <CardTitle className="text-lg">Assistant MemeVote</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-purple-400" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-lg px-4 py-2 max-w-[80%]",
                  message.role === "user"
                    ? "bg-purple-500 text-white"
                    : "bg-muted"
                )}
              >
                <p className="text-sm whitespace-pre-line">
                  {message.content}
                </p>
              </div>
              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-pink-400" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-purple-400" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Pose ta question..."
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={loading} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
