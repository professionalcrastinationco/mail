import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('=== AUTH CALLBACK TRIGGERED ===')
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  console.log('Callback params:', {
    code: code ? 'CODE_PRESENT' : 'NO_CODE',
    error,
    error_description,
    fullUrl: requestUrl.toString()
  })

  if (error) {
    console.error('OAuth error from Google:', error, error_description)
    return NextResponse.redirect(`${origin}/login?error=${error}`)
  }

  if (code) {
    try {
      const supabase = await createClient()
      console.log('Exchanging code for session...')
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('Exchange result:', {
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        hasProviderToken: !!data?.session?.provider_token,
        hasProviderRefreshToken: !!data?.session?.provider_refresh_token,
        error: exchangeError
      })
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(`${origin}/login?error=${exchangeError.message}`)
      }
      
      // Store Gmail tokens if available
      if (data?.session?.provider_token && data?.user) {
        console.log('Storing Gmail tokens...')
        try {
          // Calculate expiry (Google tokens typically expire in 1 hour)
          const expiresAt = new Date(Date.now() + 3600 * 1000)
          
          const { error: storeError } = await supabase
            .from('gmail_tokens')
            .upsert({
              user_id: data.user.id,
              access_token: data.session.provider_token,
              refresh_token: data.session.provider_refresh_token,
              expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (storeError) {
            console.error('Failed to store Gmail tokens:', storeError)
            // Don't fail the auth flow, just log the error
          } else {
            console.log('Gmail tokens stored successfully')
          }
        } catch (err) {
          console.error('Error storing Gmail tokens:', err)
        }
      }
      
      // Session should now be set, redirect to dashboard
      console.log('Success! Redirecting to dashboard...')
      return NextResponse.redirect(`${origin}/dashboard`)
    } catch (err) {
      console.error('Unexpected error in callback:', err)
      return NextResponse.redirect(`${origin}/login?error=callback_failed`)
    }
  }

  // No code or error, something's wrong
  console.log('No code or error in callback, redirecting to login')
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}