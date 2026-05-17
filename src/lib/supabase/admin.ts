import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS entirely.
// Use only in server-side contexts where no user session exists (webhooks, crons).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^["']|["']$/g, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/^["']|["']$/g, "");

  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.");
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
