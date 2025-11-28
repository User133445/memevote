"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Upload, X, Loader2, CheckCircle2, AlertCircle, Maximize2, ZoomIn, FileImage, FileVideo } from "lucide-react";
import { Label } from "@/components/ui/label";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  "AI",
  "Politics",
  "Animals",
  "Gaming",
  "Custom",
  "Other",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [errors, setErrors] = useState<{
    file?: string;
    title?: string;
    category?: string;
  }>({});
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview(null);
      setTitle("");
      setDescription("");
      setCategory("");
      setUploadProgress(0);
      setErrors({});
      setPreviewFullscreen(false);
    }
  }, [open]);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setIsAuthenticated(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user || (connected && !!publicKey));
    };

    if (open) {
      checkAuth();
    }
  }, [open, supabase, connected, publicKey]);

  // Validation en temps réel
  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};
    
    if (!file) {
      newErrors.file = "Un fichier est requis";
    } else if (file.size > MAX_FILE_SIZE) {
      newErrors.file = `Fichier trop volumineux (max ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB)`;
    }

    if (!title.trim()) {
      newErrors.title = "Le titre est requis";
    } else if (title.length > MAX_TITLE_LENGTH) {
      newErrors.title = `Titre trop long (max ${MAX_TITLE_LENGTH} caractères)`;
    }

    if (!category) {
      newErrors.category = "La catégorie est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [file, title, category]);

  useEffect(() => {
    if (open) {
      validateForm();
    }
  }, [file, title, category, open, validateForm]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif"],
      "video/*": [".mp4", ".webm"],
    },
    maxSize: MAX_FILE_SIZE,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors.some((e) => e.code === "file-too-large")) {
          setErrors({ file: `Fichier trop volumineux (max ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB)` });
        } else if (rejection.errors.some((e) => e.code === "file-invalid-type")) {
          setErrors({ file: "Type de fichier non supporté" });
        }
        return;
      }

      const file = acceptedFiles[0];
      if (file) {
        setFile(file);
        const url = URL.createObjectURL(file);
        setPreview(url);
        setErrors((prev) => ({ ...prev, file: undefined }));
      }
    },
  });

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleUpload = async () => {
    if (!validateForm()) {
      toast({
        title: "Formulaire invalide",
        description: "Veuillez corriger les erreurs avant de continuer",
        variant: "destructive",
      });
      return;
    }

    // Check if user is connected (wallet OR login)
    let isAuthenticatedViaLogin = false;
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      isAuthenticatedViaLogin = !!user;
    }

    // User must be connected via wallet OR login
    if (!connected || !publicKey) {
      if (!isAuthenticatedViaLogin) {
        setAuthDialogOpen(true);
        toast({
          title: "Connexion requise",
          description: "Connectez-vous via login (Twitter, Google, etc.) ou via votre wallet Solana pour uploader un meme",
          variant: "destructive",
        });
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Determine file type
      const isVideo = file!.type.startsWith("video/");
      const isGif = file!.type === "image/gif";
      const fileType = isVideo ? "video" : isGif ? "gif" : "image";

      // Check if user is authenticated via login
      let user = null;
      if (supabase) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        user = authUser;
      }

      // If user is authenticated via login, use normal flow
      if (user) {
        if (!supabase) {
          throw new Error("Supabase non configuré");
        }

        // Upload to Supabase Storage with progress tracking
        const fileExt = file!.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const filePath = `memes/${fileName}`;

        // Simulate progress for storage upload (Supabase doesn't provide native progress)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        const { error: uploadError } = await supabase.storage
          .from("memes")
          .upload(filePath, file!, {
            cacheControl: "3600",
            upsert: false,
          });

        clearInterval(progressInterval);
        setUploadProgress(95);

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("memes").getPublicUrl(filePath);

        setUploadProgress(98);

        // Create meme record
        const { data: meme, error: memeError } = await supabase
          .from("memes")
          .insert({
            user_id: user.id,
            title: title.trim(),
            description: description.trim() || null,
            category,
            file_url: publicUrl,
            file_type: fileType,
            file_size: file!.size,
            status: "pending", // Will be moderated
          })
          .select()
          .single();

        if (memeError) throw memeError;

        setUploadProgress(100);

        toast({
          title: "Meme uploadé !",
          description: "Votre meme est en cours de modération",
        });

        // Reset form
        setTimeout(() => {
          setFile(null);
          setPreview(null);
          setTitle("");
          setDescription("");
          setCategory("");
          setUploadProgress(0);
          onOpenChange(false);
          router.refresh();
        }, 1500);
        return;
      }

      // If wallet is connected but no login, use API route with service role key
      if (connected && publicKey) {
        const walletAddress = publicKey.toString();
        
        if (!supabase) {
          throw new Error("Supabase non configuré");
        }

        const fileExt = file!.name.split(".").pop();
        const fileName = `${walletAddress}/${Date.now()}.${fileExt}`;
        const filePath = `memes/${fileName}`;

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        const { error: uploadError } = await supabase.storage
          .from("memes")
          .upload(filePath, file!, {
            cacheControl: "3600",
            upsert: false,
          });

        clearInterval(progressInterval);
        setUploadProgress(95);

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("memes").getPublicUrl(filePath);

        setUploadProgress(98);

        // Use API route to create meme
        const response = await fetch("/api/memes/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletAddress,
            title: title.trim(),
            description: description.trim() || null,
            category,
            fileUrl: publicUrl,
            fileType,
            fileSize: file!.size,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erreur lors de l'upload");
        }

        setUploadProgress(100);

        toast({
          title: "Meme uploadé !",
          description: "Votre meme est en cours de modération",
        });

        // Reset form
        setTimeout(() => {
          setFile(null);
          setPreview(null);
          setTitle("");
          setDescription("");
          setCategory("");
          setUploadProgress(0);
          onOpenChange(false);
          router.refresh();
        }, 1500);
        return;
      }

      throw new Error("Impossible de s'authentifier. Veuillez vous connecter via login ou wallet.");
    } catch (error: any) {
      setUploadProgress(0);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d&apos;uploader le meme",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const isVideo = file?.type.startsWith("video/");
  const isGif = file?.type === "image/gif";
  const titleRemaining = MAX_TITLE_LENGTH - title.length;
  const descriptionRemaining = MAX_DESCRIPTION_LENGTH - description.length;

  return (
    <>
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
            {/* File Upload avec améliorations */}
            <div>
              <Label>Fichier *</Label>
              <div
                {...getRootProps()}
                className={cn(
                "mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden",
                isDragActive
                  ? "border-purple-500 bg-purple-500/20 scale-[1.02] shadow-lg shadow-purple-500/30"
                  : "border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/5",
                errors.file && "border-red-500/50 bg-red-500/10"
              )}
            >
                <input {...getInputProps()} />
                <AnimatePresence mode="wait">
                  {preview ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative group"
                    >
                      {isVideo ? (
                        <div className="relative">
                          <video
                            src={preview}
                            controls
                            className="max-h-96 mx-auto rounded-lg w-full"
                          />
                          <div className="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 bg-black/70 rounded-md">
                            <FileVideo className="h-4 w-4 text-purple-400" />
                            <span className="text-xs text-white">{formatFileSize(file?.size || 0)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <img
                            src={preview}
                            alt="Preview"
                            className="max-h-96 mx-auto rounded-lg w-full object-contain"
                          />
                          <div className="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 bg-black/70 rounded-md">
                            {isGif ? (
                              <>
                                <FileImage className="h-4 w-4 text-pink-400" />
                                <span className="text-xs text-white">GIF</span>
                              </>
                            ) : (
                              <>
                                <FileImage className="h-4 w-4 text-purple-400" />
                                <span className="text-xs text-white">{formatFileSize(file?.size || 0)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 hover:bg-black/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewFullscreen(true);
                          }}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                            setPreview(null);
                            if (preview) {
                              URL.revokeObjectURL(preview);
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <motion.div
                        animate={isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Upload className="h-12 w-12 mx-auto text-purple-400" />
                      </motion.div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {isDragActive ? "Lâchez le fichier ici" : "Glissez-déposez un fichier ou cliquez pour sélectionner"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Images (JPG, PNG, WebP, GIF) ou Vidéos (MP4, WebM) - Max {MAX_FILE_SIZE / 1024 / 1024}MB
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {errors.file && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center gap-2 text-sm text-red-400"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.file}</span>
                  </motion.div>
                )}
                {fileRejections.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center gap-2 text-sm text-red-400"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>Fichier rejeté. Vérifiez le type et la taille.</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Title avec validation en temps réel */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="title">Titre *</Label>
                <span className={cn(
                  "text-xs",
                  titleRemaining < 20 ? "text-red-400" : titleRemaining < 50 ? "text-yellow-400" : "text-muted-foreground"
                )}>
                  {titleRemaining} caractères restants
                </span>
              </div>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre accrocheur..."
                className={cn(
                  "mt-2",
                  errors.title && "border-red-500 focus:border-red-500"
                )}
                maxLength={MAX_TITLE_LENGTH}
              />
              {errors.title && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 flex items-center gap-2 text-sm text-red-400"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.title}</span>
                </motion.div>
              )}
            </div>

            {/* Description avec validation en temps réel */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="description">Description</Label>
                <span className={cn(
                  "text-xs",
                  descriptionRemaining < 50 ? "text-yellow-400" : "text-muted-foreground"
                )}>
                  {descriptionRemaining} caractères restants
                </span>
              </div>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre meme..."
                className="mt-2"
                rows={4}
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
            </div>

            {/* Category avec validation */}
            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className={cn(
                  "mt-2",
                  errors.category && "border-red-500 focus:border-red-500"
                )}>
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
              {errors.category && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 flex items-center gap-2 text-sm text-red-400"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.category}</span>
                </motion.div>
              )}
            </div>

            {/* Barre de progression d'upload */}
            {uploading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Upload en cours...</span>
                  <span className="font-medium text-purple-400">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </motion.div>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleUpload}
                disabled={uploading || !file || !title || !category || Object.keys(errors).length > 0}
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
                disabled={uploading}
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Fullscreen Modal */}
      <AnimatePresence>
        {previewFullscreen && preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setPreviewFullscreen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-7xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {isVideo ? (
                <video
                  src={preview}
                  controls
                  autoPlay
                  className="w-full h-full rounded-lg"
                />
              ) : (
                <img
                  src={preview}
                  alt="Preview fullscreen"
                  className="w-full h-full object-contain rounded-lg"
                />
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-4 right-4"
                onClick={() => setPreviewFullscreen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onSuccess={() => {
          setIsAuthenticated(true);
          setAuthDialogOpen(false);
        }}
      />
    </>
  );
}
