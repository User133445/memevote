"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Save, 
  User, 
  Palette,
  Bell,
  FileText,
  Scale,
  Download,
  RefreshCw,
  Globe,
  ChevronRight,
  Headphones,
  Settings as SettingsIcon,
  Lock
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";

export default function SettingsPage() {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [discordHandle, setDiscordHandle] = useState("");

  const [showAnimations, setShowAnimations] = useState(true);
  const [showDustBalances, setShowDustBalances] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [connected, publicKey]);

  const fetchProfile = async () => {
    if (!publicKey) {
      setLoading(false);
      return;
    }

    const supabaseClient = createClient();
    if (!supabaseClient) {
      setLoading(false);
      return;
    }

    try {
      const { data: user } = await supabaseClient.auth.getUser();
      if (!user.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("wallet_address", publicKey.toString())
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setProfile(data);
        setUsername(data.username || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || "");
        setTwitterHandle(data.twitter_handle || "");
        setDiscordHandle(data.discord_handle || "");
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!publicKey) {
      toast({
        title: "Erreur",
        description: "Connectez votre wallet pour modifier votre profil",
        variant: "destructive",
      });
      return;
    }

    const supabaseClient = createClient();
    if (!supabaseClient) {
      toast({
        title: "Erreur",
        description: "Supabase non configuré",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { data: user } = await supabaseClient.auth.getUser();
      if (!user.user) {
        throw new Error("Utilisateur non authentifié");
      }

      const { error } = await supabaseClient
        .from("profiles")
        .upsert({
          id: user.user.id,
          wallet_address: publicKey.toString(),
          username: username.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl.trim(),
          twitter_handle: twitterHandle.trim(),
          discord_handle: discordHandle.trim(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "wallet_address",
        });

      if (error) throw error;

      toast({
        title: "Profil mis à jour !",
        description: "Vos modifications ont été enregistrées.",
      });

      await fetchProfile();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder le profil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !publicKey) return;

    const supabaseClient = createClient();
    if (!supabaseClient) {
      toast({
        title: "Erreur",
        description: "Supabase non configuré",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: user } = await supabaseClient.auth.getUser();
      if (!user.user) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabaseClient.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabaseClient.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
      
      toast({
        title: "Avatar uploadé !",
        description: "N&apos;oubliez pas de sauvegarder vos modifications.",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Erreur",
        description: "Impossible d&apos;uploader l&apos;avatar",
        variant: "destructive",
      });
    }
  };

  if (!connected || !publicKey) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="glass-effect border-purple-500/20 bg-black/50">
          <CardHeader>
            <CardTitle>Manage account</CardTitle>
            <CardDescription>
              Connectez votre wallet pour accéder aux paramètres
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage account</h1>
          <p className="text-muted-foreground">
            Logged in with wallet
          </p>
        </div>

        {/* Main Settings List */}
        <Card className="glass-effect border-purple-500/20 bg-black/50">
          <CardContent className="p-0">
            <Link href="/settings/profile" className="block">
              <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-purple-400" />
                  <span className="font-medium">Edit profile</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <Separator />
            <Link href="/settings/appearance" className="block">
              <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-purple-400" />
                  <span className="font-medium">Appearance</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <Separator />
            <Link href="/settings/notifications" className="block">
              <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-purple-400" />
                  <span className="font-medium">Notifications</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <Separator />
            <Link href="/tokens" className="block">
              <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-purple-400" />
                  <span className="font-medium">Transactions</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <Separator />
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-purple-400" />
                <div>
                  <span className="font-medium">Language</span>
                  <p className="text-xs text-muted-foreground">English</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <Separator />
            <Link href="/settings" className="block">
              <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <SettingsIcon className="h-5 w-5 text-purple-400" />
                  <span className="font-medium">Settings</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <Separator />
            <Link href="/settings/legal" className="block">
              <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Scale className="h-5 w-5 text-purple-400" />
                  <span className="font-medium">Legal</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card className="glass-effect border-purple-500/20 bg-black/50">
          <CardHeader>
            <CardTitle>Support</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <a href="https://t.me/memevote" target="_blank" rel="noopener noreferrer" className="block">
              <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Headphones className="h-5 w-5 text-purple-400" />
                  <span className="font-medium">Live chat</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">External</span>
                  <div className="w-4 h-4 border border-current rounded"></div>
                </div>
              </div>
            </a>
            <Separator />
            <a href="/faq" className="block">
              <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-purple-400" />
                  <span className="font-medium">FAQs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">External</span>
                  <div className="w-4 h-4 border border-current rounded"></div>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>

        {/* Settings Toggles */}
        <Card className="glass-effect border-purple-500/20 bg-black/50">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Show animations</Label>
                <p className="text-xs text-muted-foreground">Show animations in meme feeds</p>
              </div>
              <Switch checked={showAnimations} onCheckedChange={setShowAnimations} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Show dust balances</Label>
                <p className="text-xs text-muted-foreground">Show tokens with small balance</p>
              </div>
              <Switch checked={showDustBalances} onCheckedChange={setShowDustBalances} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Biometric authentication</Label>
                <p className="text-xs text-muted-foreground">Require Face ID/Touch ID to access your wallet</p>
              </div>
              <Switch checked={biometricAuth} onCheckedChange={setBiometricAuth} />
            </div>
          </CardContent>
        </Card>

        {/* Export Wallet */}
        <Card className="glass-effect border-purple-500/20 bg-black/50">
          <CardContent className="p-0">
            <Link href="/settings/export" className="block">
              <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-purple-400" />
                  <div>
                    <span className="font-medium">Export wallet</span>
                    <p className="text-xs text-muted-foreground">Export your wallet private key</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <Separator />
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-purple-400" />
                <div>
                  <span className="font-medium">Check updates</span>
                  <p className="text-xs text-muted-foreground">Runtime 0.11.3 (555) #7e776995-5f42-4dbf-b818-2429b320ff94</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Edit Section */}
        <Card className="glass-effect border-purple-500/20 bg-black/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Edit Profile
            </CardTitle>
            <CardDescription>
              Modifiez vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 border-2 border-purple-500/50">
                <AvatarImage src={avatarUrl} alt={username} />
                <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-bold">
                  {username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="avatar" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <User className="h-4 w-4 mr-2" />
                      Change avatar
                    </span>
                  </Button>
                </Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  PNG, JPG ou GIF. Max 2MB
                </p>
              </div>
            </div>

            <Separator />

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                maxLength={30}
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {bio.length}/500 characters
              </p>
            </div>

            <Separator />

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Social Media</h3>
              
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter / X</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">@</span>
                  <Input
                    id="twitter"
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value.replace("@", ""))}
                    placeholder="your_handle"
                    maxLength={30}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discord">Discord</Label>
                <Input
                  id="discord"
                  value={discordHandle}
                  onChange={(e) => setDiscordHandle(e.target.value)}
                  placeholder="your_handle#1234"
                  maxLength={50}
                />
              </div>
            </div>

            <Separator />

            {/* Wallet Address (Read-only) */}
            <div className="space-y-2">
              <Label>Wallet Address</Label>
              <Input
                value={publicKey.toString()}
                disabled
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Your Solana wallet address (read-only)
              </p>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saving || !username.trim()}
              variant="neon"
              className="w-full"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
