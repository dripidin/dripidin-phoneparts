// Supabase OAuth Auth Callback Route Handler

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/account';

  if (code) {
    const supabase = createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page or login with error
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
