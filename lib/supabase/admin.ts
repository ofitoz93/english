import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// service_role client — bypasses RLS. NEVER import this from a Client
// Component or expose it to the browser bundle. Only used for: sending
// admin invites, listing auth.users for the admin panel, and writing to
// the shared dictionary_cache table.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
