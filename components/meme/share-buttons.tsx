"use client";

import {
  TwitterShareButton,
  FacebookShareButton,
  WhatsappShareButton,
  TwitterIcon,
  FacebookIcon,
  WhatsappIcon,
} from "react-share";
import { getShareUrl } from "@/lib/utils";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareButtonsProps {
  meme: any;
}

export function ShareButtons({ meme }: ShareButtonsProps) {
  const shareUrl = getShareUrl(`/meme/${meme.id}`);
  const shareText = `🔥 ${meme.title} - Votez sur MemeVote.fun !`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Share2 className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-effect">
        <DropdownMenuItem asChild>
          <TwitterShareButton url={shareUrl} title={shareText}>
            <div className="flex items-center gap-2 w-full">
              <TwitterIcon size={20} round />
              <span>Twitter</span>
            </div>
          </TwitterShareButton>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <FacebookShareButton url={shareUrl} quote={shareText}>
            <div className="flex items-center gap-2 w-full">
              <FacebookIcon size={20} round />
              <span>Facebook</span>
            </div>
          </FacebookShareButton>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <WhatsappShareButton url={shareUrl} title={shareText}>
            <div className="flex items-center gap-2 w-full">
              <WhatsappIcon size={20} round />
              <span>WhatsApp</span>
            </div>
          </WhatsappShareButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

