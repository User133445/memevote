"use client";

import { formatDate } from "@/lib/utils";
import { ThumbsUp, ThumbsDown, Upload, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Activity {
  id: string;
  type: "upvote" | "downvote" | "upload" | "trending";
  meme?: any;
  user?: any;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "upvote":
        return <ThumbsUp className="h-4 w-4 text-green-400" />;
      case "downvote":
        return <ThumbsDown className="h-4 w-4 text-red-400" />;
      case "upload":
        return <Upload className="h-4 w-4 text-blue-400" />;
      case "trending":
        return <TrendingUp className="h-4 w-4 text-purple-400" />;
      default:
        return null;
    }
  };

  const getActivityText = (activity: Activity) => {
    const username = activity.user?.username || "Anonyme";
    const memeTitle = activity.meme?.title || "un meme";

    switch (activity.type) {
      case "upvote":
        return `${username} a upvoté "${memeTitle}"`;
      case "downvote":
        return `${username} a downvoté "${memeTitle}"`;
      case "upload":
        return `${username} a uploadé "${memeTitle}"`;
      case "trending":
        return `"${memeTitle}" est en tendance !`;
      default:
        return "";
    }
  };

  return (
    <div className="space-y-2">
      {activities.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucune activité récente
        </div>
      ) : (
        activities.map((activity) => (
          <Card
            key={activity.id}
            className="glass-effect hover:scale-[1.02] transition-transform"
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{getActivityText(activity)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

