import { createServerComponentClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth callback handler for Google authentication
 * This route handles the redirect from Google OAuth after a user authenticates
 * It exchanges the code for a session and redirects to the dashboard
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // If no code is present, redirect to home page
  if (!code) {
    return NextResponse.redirect(new URL('/', requestUrl.origin));
  }

  try {
    // Create a Supabase client for the server component
    const supabase = createServerComponentClient();
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);
    
    // Redirect to dashboard after successful authentication
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
  } catch (error) {
    console.error('Error in auth callback:', error);
    
    // Redirect to login page with error parameter on failure
    return NextResponse.redirect(
      new URL('/?error=Authentication%20failed', requestUrl.origin)
    );
  }
}
