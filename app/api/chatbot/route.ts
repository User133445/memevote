import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// DeepSeek utilise l'API OpenAI compatible
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "",
  baseURL: "https://api.deepseek.com",
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message requis" },
        { status: 400 }
      );
    }

    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `Tu es l'assistant de MemeVote.fun, une plateforme de vote de memes sur Solana avec récompenses play-to-earn.

Tu dois aider les utilisateurs avec :
- Upload de memes
- Système de vote et récompenses
- Staking de $VOTE
- Parrainage
- Abonnements Premium
- Battles
- NFTs
- Live feed

Réponds de manière amicale et concise en français.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 
      "Désolé, je n'ai pas pu générer de réponse.";

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("Chatbot error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur du chatbot" },
      { status: 500 }
    );
  }
}

