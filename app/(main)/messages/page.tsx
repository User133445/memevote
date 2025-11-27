"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Search, Plus, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type Conversation = {
  id: string;
  participants: any[];
  last_message: string;
  updated_at: string;
  unread_count: number;
};

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function MessagesPage() {
  const { publicKey } = useWallet();
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Mock data for UI demonstration
  const mockConversations = [
    {
      id: "1",
      participants: [{ username: "CryptoKing", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoKing" }],
      last_message: "Hey! Loved your last meme 😂",
      updated_at: new Date().toISOString(),
      unread_count: 2
    },
    {
      id: "2",
      participants: [{ username: "SolanaWhale", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=SolanaWhale" }],
      last_message: "Wanna collab on a project?",
      updated_at: new Date(Date.now() - 3600000).toISOString(),
      unread_count: 0
    }
  ];

  useEffect(() => {
    // In a real implementation, we would fetch from Supabase here
    // For now, we use mock data to show the UI structure
    setConversations(mockConversations);
    setLoading(false);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = {
      id: Math.random().toString(),
      sender_id: "me",
      content: newMessage,
      created_at: new Date().toISOString()
    };

    setMessages([...messages, msg]);
    setNewMessage("");
  };

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <MessageCircle className="h-16 w-16 text-purple-500 mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold mb-2">Connect Wallet to Chat</h2>
        <p className="text-muted-foreground mb-4">Chat with other meme creators privately.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 h-[calc(100vh-80px)]">
      <div className="grid md:grid-cols-3 gap-6 h-full">
        
        {/* Sidebar: Conversations List */}
        <Card className="glass-effect border-purple-500/20 col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-3 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-xl">Messages</CardTitle>
              <Button size="icon" variant="ghost" className="rounded-full">
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search chats..." 
                className="pl-9 bg-black/20 border-white/10"
              />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConversation(conv.id);
                    // Load mock messages
                    setMessages([
                      { id: "1", sender_id: "other", content: conv.last_message, created_at: conv.updated_at },
                      { id: "2", sender_id: "me", content: "Yeah it was viral! 🚀", created_at: new Date().toISOString() }
                    ]);
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-white/5",
                    activeConversation === conv.id && "bg-purple-500/10 border border-purple-500/20"
                  )}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={conv.participants[0].avatar_url} />
                      <AvatarFallback>{conv.participants[0].username[0]}</AvatarFallback>
                    </Avatar>
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold truncate">{conv.participants[0].username}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={cn(
                      "text-sm truncate",
                      conv.unread_count > 0 ? "text-white font-medium" : "text-muted-foreground"
                    )}>
                      {conv.last_message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Window */}
        <Card className="glass-effect border-purple-500/20 md:col-span-2 flex flex-col overflow-hidden">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-black/20">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={mockConversations.find(c => c.id === activeConversation)?.participants[0].avatar_url} />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-sm">
                    {mockConversations.find(c => c.id === activeConversation)?.participants[0].username}
                  </h3>
                  <span className="flex items-center gap-1.5 text-xs text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <span className="text-xs text-muted-foreground bg-black/20 px-3 py-1 rounded-full">
                      End-to-end encrypted 🔒
                    </span>
                  </div>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex w-full",
                        msg.sender_id === "me" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-[70%] px-4 py-2 rounded-2xl text-sm",
                        msg.sender_id === "me" 
                          ? "bg-purple-600 text-white rounded-tr-none" 
                          : "bg-white/10 text-gray-200 rounded-tl-none"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t border-white/5 bg-black/20">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..." 
                    className="bg-black/20 border-white/10 focus-visible:ring-purple-500"
                  />
                  <Button type="submit" size="icon" variant="default" className="bg-purple-600 hover:bg-purple-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 opacity-50" />
              </div>
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

