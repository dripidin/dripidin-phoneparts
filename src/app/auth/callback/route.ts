// Supabase OAuth Auth Callback Route Handler
// Exchanges authorization code for session and persists session cookies

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/account';

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isDevelopment = process.env.NODE_ENV === 'development';

      if (isDevelopment) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hamzaphone.vercel.app';
        return NextResponse.redirect(`${siteUrl}${next}`);
      }
    }
  }

  // Return the user to login with error
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
