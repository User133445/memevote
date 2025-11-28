import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { securityMiddleware, withCors } from "@/lib/security/middleware";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  // Apply security middleware
  const { rateLimitResponse, corsPreflightResponse } = securityMiddleware(
    request,
    RATE_LIMITS.UPLOAD
  );

  if (corsPreflightResponse) {
    return corsPreflightResponse;
  }

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { walletAddress, title, description, category, fileUrl, fileType, fileSize } = await request.json();

    if (!walletAddress || !title || !category || !fileUrl) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // Find or create user by wallet address
    let userId: string | null = null;

    // First, try to find existing profile by wallet address
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single();

    if (existingProfile) {
      userId = existingProfile.id;
    } else {
      // Create new user in auth.users (bypassing email confirmation)
      const email = `${walletAddress}@wallet.memevote.fun`;
      
      // Try to find existing auth user by email
      try {
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (!listError && existingUsers?.users) {
          const existingUser = existingUsers.users.find(
            (u: any) => u.email === email
          );

          if (existingUser) {
            userId = existingUser.id;
            // Confirm the user if not confirmed
            if (!existingUser.email_confirmed_at) {
              await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
                email_confirm: true,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error listing users:", error);
        // Continue to create new user
      }

      // If user not found, create new one
      if (!userId) {
        // Create new user with email auto-confirmed
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: walletAddress,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            wallet_address: walletAddress,
            username: `user_${walletAddress.slice(0, 8)}`,
          },
        });

        if (createError) {
          throw new Error(`Erreur lors de la création de l'utilisateur: ${createError.message}`);
        }

        userId = newUser.user.id;

        // Create profile
        const walletName = "Unknown"; // Could be passed from client
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: userId,
            wallet_address: walletAddress,
            username: `user_${walletAddress.slice(0, 8)}`,
            points: 0,
            level: 1,
            wallet_name: walletName,
            first_connection_bonus_claimed: false,
          });

        if (profileError && !profileError.message.includes("duplicate")) {
          console.error("Error creating profile:", profileError);
          // Continue anyway, profile might already exist
        }
      }
    }

    if (!userId) {
      throw new Error("Impossible de créer ou trouver l'utilisateur");
    }

    // Create meme record
    const { data: meme, error: memeError } = await supabaseAdmin
      .from("memes")
      .insert({
        user_id: userId,
        title,
        description: description || null,
        category,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize,
        status: "pending", // Will be moderated
      })
      .select()
      .single();

    if (memeError) {
      throw memeError;
    }

    const successResponse = NextResponse.json({ success: true, meme });
    return withCors(request, successResponse);
  } catch (error: any) {
    console.error("Error uploading meme:", error);
    const errorResponse = NextResponse.json(
      { error: error.message || "Erreur lors de l'upload du meme" },
      { status: 500 }
    );
    return withCors(request, errorResponse);
  }
}
