import { type EmailOtpType } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  // Redirect to error page if token hash or type is missing
  if (!token_hash || !type) {
    return NextResponse.redirect(new URL('/reset-password?error=invalid_link', origin));
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Verify the OTP token
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });

  if (error) {
    return NextResponse.redirect(new URL(`/reset-password?error=${encodeURIComponent(error.message)}`, origin));
  }

  // Redirect to the specified next URL (should be /reset-password for recovery)
  return NextResponse.redirect(new URL(next, origin));
}