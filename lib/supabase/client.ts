import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return null if Supabase is not configured (for demo mode)
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
    return null as any;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}

