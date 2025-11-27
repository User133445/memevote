"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    checkPremium();
  }, []);

  const checkPremium = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        setLoading(false);
        return;
      }

      // Check subscription
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.user.id)
        .eq("status", "active")
        .single();

      if (subscription) {
        // Check if trial
        const trialEnd = new Date(subscription.trial_end || 0);
        const now = new Date();
        
        if (trialEnd > now && subscription.trial_end) {
          setIsTrial(true);
          setIsPremium(true);
          const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          setTrialDaysLeft(daysLeft);
        } else {
          setIsPremium(true);
          setIsTrial(false);
        }
      }
    } catch (error) {
      console.error("Error checking premium:", error);
    } finally {
      setLoading(false);
    }
  };

  return { isPremium, isTrial, trialDaysLeft, loading, refetch: checkPremium };
}

