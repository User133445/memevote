import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(request: NextRequest) {
  try {
    const { userId, reason } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID requis" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (subError || !subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "Abonnement non trouvé" },
        { status: 404 }
      );
    }

    // Cancel subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.cancel(
      subscription.stripe_subscription_id,
      {
        cancellation_details: {
          comment: reason || "Annulation par l'utilisateur",
        },
      }
    );

    // Update subscription status in database
    await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        cancellation_reason: reason || null,
      })
      .eq("stripe_subscription_id", subscription.stripe_subscription_id);

    return NextResponse.json({
      success: true,
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
      },
    });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'annulation" },
      { status: 500 }
    );
  }
}

