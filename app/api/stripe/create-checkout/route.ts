import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(request: NextRequest) {
  try {
    const { userId, walletAddress } = await request.json();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "MemeVote.fun Premium",
              description: "Abonnement Premium - Votes illimités, sans pub, memes exclusifs",
            },
            recurring: {
              interval: "month",
            },
            unit_amount: 999, // 9.99€
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 3, // 3 jours d'essai gratuit
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium?canceled=true`,
      metadata: {
        userId,
        walletAddress,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

