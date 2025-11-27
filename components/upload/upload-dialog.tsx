"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

const CATEGORIES = [
  "AI",
  "Politics",
  "Animals",
  "Gaming",
  "Custom",
  "Other",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif"],
      "video/*": [".mp4", ".webm"],
    },
    maxSize: MAX_FILE_SIZE,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        setFile(file);
        const url = URL.createObjectURL(file);
        setPreview(url);
      }
    },
  });

  const handleUpload = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Connexion requise",
        description: "Connectez votre wallet Solana pour uploader un meme et gagner des récompenses",
        variant: "destructive",
      });
      return;
    }

    if (!file || !title || !category) {
      toast({
        title: "Champs requis",
        description: "Remplissez tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      if (!supabase) {
        throw new Error("Supabase non configuré");
      }

      // Get user ID - try to authenticate if not already authenticated
      let {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Try to authenticate with wallet
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: `${publicKey.toString()}@wallet.memevote.fun`,
          password: publicKey.toString(),
        });

        if (authError && authError.message.includes("Invalid login")) {
          // Create new user if doesn't exist
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: `${publicKey.toString()}@wallet.memevote.fun`,
            password: publicKey.toString(),
            options: {
              data: {
                wallet_address: publicKey.toString(),
                username: `user_${publicKey.toString().slice(0, 8)}`,
              },
            },
          });

          if (signUpError) {
            throw new Error(`Erreur d'authentification: ${signUpError.message}`);
          }

          user = signUpData.user;

          // Create profile if user was created
          if (user) {
            const walletName = (window as any).solana?.isPhantom ? "Phantom" :
                              (window as any).solflare ? "Solflare" :
                              (window as any).backpack ? "Backpack" :
                              (window as any).okxwallet ? "OKX" :
                              (window as any).trustwallet ? "Trust Wallet" :
                              (window as any).ledger ? "Ledger" : "Unknown";

            await supabase
              .from("profiles")
              .insert({
                id: user.id,
                wallet_address: publicKey.toString(),
                username: `user_${publicKey.toString().slice(0, 8)}`,
                points: 0,
                level: 1,
                wallet_name: walletName,
                first_connection_bonus_claimed: false,
              });
          }
        } else if (authError) {
          throw new Error(`Erreur d'authentification: ${authError.message}`);
        } else {
          user = authData.user;
        }
      }

      if (!user) {
        throw new Error("Impossible de s'authentifier. Veuillez réessayer.");
      }

      // Determine file type
      const isVideo = file.type.startsWith("video/");
      const isGif = file.type === "image/gif";
      const fileType = isVideo ? "video" : isGif ? "gif" : "image";

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `memes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("memes")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("memes").getPublicUrl(filePath);

      // Create meme record
      const { data: meme, error: memeError } = await supabase
        .from("memes")
        .insert({
          user_id: user.id,
          title,
          description: description || null,
          category,
          file_url: publicUrl,
          file_type: fileType,
          file_size: file.size,
          status: "pending", // Will be moderated
        })
        .select()
        .single();

      if (memeError) throw memeError;

      toast({
        title: "Meme uploadé !",
        description: "Votre meme est en cours de modération",
      });

      // Reset form
      setFile(null);
      setPreview(null);
      setTitle("");
      setDescription("");
      setCategory("");
      onOpenChange(false);

      // Refresh feed after a delay
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d&apos;uploader le meme",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-effect border-purple-500/20 sm:max-w-2xl bg-black/95 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Uploader un Meme
          </DialogTitle>
          <DialogDescription>
            Partagez votre meilleur meme et gagnez des récompenses !
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* File Upload */}
          <div>
            <Label>Fichier *</Label>
            <div
              {...getRootProps()}
              className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-purple-500/30 hover:border-purple-500/50"
              }`}
            >
              <input {...getInputProps()} />
              {preview ? (
                <div className="relative">
                  {file?.type.startsWith("video/") ? (
                    <video
                      src={preview}
                      controls
                      className="max-h-96 mx-auto rounded-lg"
                    />
                  ) : (
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-96 mx-auto rounded-lg"
                    />
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setPreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-purple-400" />
                  <p className="text-sm text-muted-foreground">
                    Glissez-déposez un fichier ou cliquez pour sélectionner
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Images (JPG, PNG, WebP, GIF) ou Vidéos (MP4, WebM) - Max 50MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre accrocheur..."
              className="mt-2"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre meme..."
              className="mt-2"
              rows={4}
              maxLength={500}
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Catégorie *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Sélectionnez une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={uploading || !file || !title || !category}
              className="flex-1"
              size="lg"
              variant="neon"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Uploader le Meme
                </>
              )}
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              size="lg"
            >
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

