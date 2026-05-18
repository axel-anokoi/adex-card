import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Strip surrounding quotes — a common copy-paste mistake when setting env vars from .env files
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^["']|["']$/g, "");
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(/^["']|["']$/g, "");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
