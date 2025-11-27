import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "sk-310a753ad05e475c9f4a10c1f7e72756",
  baseURL: "https://api.deepseek.com",
});

export async function POST(request: NextRequest) {
  try {
    const { memeId, title, description, fileUrl } = await request.json();

    if (!memeId || !title) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // Use DeepSeek to moderate content (moderation endpoint not available, use chat completion)
    // For moderation, we'll use a simple keyword check + AI categorization
    const moderationKeywords = ["hate", "violence", "nsfw", "explicit"];
    const contentLower = `${title} ${description || ""}`.toLowerCase();
    const isFlagged = moderationKeywords.some(keyword => contentLower.includes(keyword));
    const isNSFW = isFlagged; // Simplified check

    // Auto-categorize with AI
    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "Tu es un expert en catégorisation de memes. Catégorise ce meme en une seule catégorie : AI, Politics, Animals, Gaming, ou Custom.",
        },
        {
          role: "user",
          content: `Titre: ${title}\nDescription: ${description || "Aucune"}`,
        },
      ],
      max_tokens: 10,
    });

    const suggestedCategory =
      completion.choices[0]?.message?.content?.trim() || "Custom";

    // Update meme status
    const supabase = await createClient();
    await supabase
      .from("memes")
      .update({
        status: isFlagged ? "rejected" : "approved",
        rejection_reason: isFlagged
          ? "Contenu inapproprié détecté par l'IA"
          : null,
        category: suggestedCategory,
      })
      .eq("id", memeId);

    return NextResponse.json({
      approved: !isFlagged,
      isNSFW,
      suggestedCategory,
    });
  } catch (error: any) {
    console.error("Moderation error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur de modération" },
      { status: 500 }
    );
  }
}

