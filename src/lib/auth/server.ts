// Supabase Server Client for HamzaPhone Server Components and Server Actions
// Next.js 16 Asynchronous Cookie Handling (@supabase/ssr)

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

export interface CookieStoreAdapter {
  getAll: () => Array<{ name: string; value: string }>;
  set?: (name: string, value: string, options?: Record<string, unknown>) => void;
}

export async function createServerClient(customCookieStore?: CookieStoreAdapter) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[CRITICAL] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in production.');
    }
  }

  const effectiveUrl = supabaseUrl || 'https://gcqseaefboaijktusjmg.supabase.co';
  const effectiveKey = supabaseAnonKey || 'default-anon-key';

  // In Next.js 16, cookies() is asynchronous
  const cookieStore = customCookieStore ? null : await cookies();

  return createSupabaseServerClient<Database>(effectiveUrl, effectiveKey, {
    cookies: {
      getAll() {
        if (customCookieStore) {
          return customCookieStore.getAll();
        }
        return cookieStore ? cookieStore.getAll() : [];
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, any> }>) {
        if (customCookieStore && customCookieStore.set) {
          cookiesToSet.forEach(({ name, value, options }) => {
            customCookieStore.set!(name, value, options);
          });
          return;
        }

        if (!cookieStore) return;

        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component (where response headers are locked).
          // This is safely ignored if proxy.ts / middleware refreshes user sessions on requests.
        }
      },
    },
  });
}
