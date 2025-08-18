import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the refresh token from the database
    const { data: tokenRecord, error: fetchError } = await supabase
      .from('gmail_tokens')
      .select('refresh_token')
      .eq('user_id', user.id)
      .single()

    if (fetchError || !tokenRecord?.refresh_token) {
      return NextResponse.json({ error: 'No refresh token found' }, { status: 404 })
    }

    // Refresh the token using Google's OAuth2 endpoint
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: tokenRecord.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token refresh failed:', errorText)
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 })
    }

    const data = await response.json()
    const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000)

    // Update the stored tokens
    const { error: updateError } = await supabase
      .from('gmail_tokens')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token || tokenRecord.refresh_token,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to update tokens:', updateError)
      return NextResponse.json({ error: 'Failed to save new token' }, { status: 500 })
    }

    return NextResponse.json({
      access_token: data.access_token,
      expires_at: expiresAt.toISOString()
    })
  } catch (error) {
    console.error('Unexpected error in token refresh:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
