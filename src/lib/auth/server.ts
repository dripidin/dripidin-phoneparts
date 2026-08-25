// Supabase Server Client for HamzaPhone Server Components and Server Actions

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

export interface CookieStoreAdapter {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options: Record<string, unknown>) => void;
  delete: (name: string) => void;
}

export function createServerClient(cookieStore?: CookieStoreAdapter) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (!cookieStore) return [];
        // Support Next.js cookie object if provided
        return [];
      },
      setAll() {
        // Handled via Server Actions or middleware
      },
    },
  });
}
