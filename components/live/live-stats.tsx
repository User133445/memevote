"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Coins, Zap } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface LiveStatsProps {
  stats: {
    totalVotes: number;
    totalMemes: number;
    activeUsers: number;
    totalVolume: number;
  };
}

export function LiveStats({ stats }: LiveStatsProps) {
  const statItems = [
    {
      label: "Votes (24h)",
      value: formatNumber(stats.totalVotes),
      icon: TrendingUp,
      color: "text-green-400",
    },
    {
      label: "Memes (24h)",
      value: formatNumber(stats.totalMemes),
      icon: Zap,
      color: "text-purple-400",
    },
    {
      label: "Utilisateurs actifs",
      value: formatNumber(stats.activeUsers),
      icon: Users,
      color: "text-blue-400",
    },
    {
      label: "Volume (24h)",
      value: `${formatNumber(stats.totalVolume)} $VOTE`,
      icon: Coins,
      color: "text-yellow-400",
    },
  ];

  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle>Statistiques Live</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${item.color}`} />
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
              </div>
              <span className="font-semibold">{item.value}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

