import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { securityMiddleware, withCors } from "@/lib/security/middleware";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "",
  baseURL: "https://api.deepseek.com",
});

export async function POST(request: NextRequest) {
  // Apply security middleware
  const { rateLimitResponse, corsPreflightResponse } = securityMiddleware(
    request,
    RATE_LIMITS.AI
  );

  if (corsPreflightResponse) {
    return corsPreflightResponse;
  }

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { title, description, category } = await request.json();

    if (!title || !category) {
      return NextResponse.json(
        { error: "Title and category are required" },
        { status: 400 }
      );
    }

    // Use OpenAI to predict viral score
    const prompt = `Analyze this meme and predict its viral potential (0-100 score):
Title: ${title}
Description: ${description || "N/A"}
Category: ${category}

Consider:
- Title catchiness and length
- Category popularity
- Description quality
- Overall meme appeal

Return ONLY a number between 0-100 representing viral score.`;

    try {
      const completion = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a meme viral prediction expert. Return only a number between 0-100.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 10,
        temperature: 0.7,
      });

      const scoreText = completion.choices[0]?.message?.content?.trim() || "50";
      const score = Math.min(Math.max(parseInt(scoreText) || 50, 0), 100);

      return NextResponse.json({ score });
    } catch (deepseekError) {
      // Fallback calculation if DeepSeek fails
      let score = 50;
      if (title.length > 10 && title.length < 50) score += 15;
      if (description && description.length > 20) score += 10;
      if (category === "AI" || category === "Politics") score += 15;
      score = Math.min(score + Math.floor(Math.random() * 20), 100);

      const jsonResponse = NextResponse.json({ score });
      return withCors(request, jsonResponse);
    }
  } catch (error: any) {
    console.error("Error calculating viral score:", error);
    const errorResponse = NextResponse.json(
      { error: error.message || "Failed to calculate viral score" },
      { status: 500 }
    );
    return withCors(request, errorResponse);
  }
}

