"use client";

import { BadgeSystem } from "@/components/badges/badge-system";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Award, Crown } from "lucide-react";

export default function BadgesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-400" />
          Badges & Achievements
        </h1>
        <p className="text-muted-foreground">
          Collectionnez des badges en accomplissant des défis et montrez vos réalisations
        </p>
      </div>

      <Card className="glass-effect border-purple-500/20 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-400" />
            Comment obtenir des badges ?
          </CardTitle>
          <CardDescription>
            Les badges sont obtenus en accomplissant différentes actions sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="text-2xl mb-2">🥉</div>
              <div className="font-bold mb-1">Badges Communs</div>
              <div className="text-sm text-muted-foreground">
                Obtenez-les facilement en utilisant la plateforme régulièrement
              </div>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-2xl mb-2">💎</div>
              <div className="font-bold mb-1">Badges Rares</div>
              <div className="text-sm text-muted-foreground">
                Accomplissez des défis plus difficiles pour les débloquer
              </div>
            </div>
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="text-2xl mb-2">👑</div>
              <div className="font-bold mb-1">Badges Légendaires</div>
              <div className="text-sm text-muted-foreground">
                Les plus prestigieux - réservés aux meilleurs créateurs
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <BadgeSystem />
    </div>
  );
}

