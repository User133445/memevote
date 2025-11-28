"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Upload, MessageCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { UploadDialog } from "@/components/upload/upload-dialog";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";

export function FloatingActionButton() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

  // Listen for custom event to open upload dialog
  useEffect(() => {
    const handleOpenUpload = () => {
      setUploadDialogOpen(true);
    };

    window.addEventListener('open-upload-dialog', handleOpenUpload);
    return () => {
      window.removeEventListener('open-upload-dialog', handleOpenUpload);
    };
  }, []);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className={cn(
                "h-12 w-12 rounded-full shadow-lg shadow-purple-500/50",
                "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
                "transition-all hover:scale-110"
              )}
            >
              <Image
                src="/favicon.svg"
                alt="MemeVote"
                width={24}
                height={24}
                className="brightness-0 invert"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="glass-effect border-purple-500/20 bg-black/95 min-w-[200px]"
          >
            <DropdownMenuItem
              onClick={() => setUploadDialogOpen(true)}
              className="cursor-pointer gap-2"
            >
              <Upload className="h-4 w-4" />
              Uploader un Meme
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={() => {
                // Open chatbot by dispatching a custom event
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent('open-chatbot'));
                }
              }}
              className="cursor-pointer gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Support / Aide
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={() => setFeedbackDialogOpen(true)}
              className="cursor-pointer gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Feedback / Suggestions
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Upload Dialog */}
      <UploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />
      
      {/* Feedback Dialog */}
      <FeedbackDialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen} />
    </>
  );
}

