import { createClient as createAdminBase } from "@supabase/supabase-js";

// Use for server-side operations that bypass RLS.
// NEVER import this in Client Components.
export function createAdminClient() {
  return createAdminBase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}