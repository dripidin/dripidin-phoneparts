// Supabase Admin Client (Service Role) for Background Tasks, Webhooks, Transactional Checkout and System Operations
// Server-Only Execution: NEVER bundled into client-side code, NEVER logs secret key

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gcqseaefboaijktusjmg.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[CRITICAL] Missing SUPABASE_SERVICE_ROLE_KEY in production environment.');
    }
    // Only in local development / unit test mocking if explicitly allowed
    throw new Error('[CRITICAL] SUPABASE_SERVICE_ROLE_KEY is required for privileged server operations.');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
