import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Components / Server Actions / Route Handlers client.
// Reads the session cookie set by proxy.ts; can only WRITE cookies
// from a Server Action or Route Handler (Server Components are read-only,
// hence the try/catch below).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component - safe to ignore because
            // proxy.ts already refreshes the session on every request.
          }
        },
      },
    },
  );
}
