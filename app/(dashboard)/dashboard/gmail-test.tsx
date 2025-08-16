'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

export default function GmailTest() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session error:', error)
        setSessionInfo({ error: error.message })
      } else if (session) {
        console.log('Full session object:', session)
        
        // Check if we have Gmail access
        const sessionData = {
          hasProviderToken: !!session.provider_token,
          hasProviderRefreshToken: !!session.provider_refresh_token,
          provider: session.user?.app_metadata?.provider,
          expiresAt: new Date(session.expires_at! * 1000).toLocaleString(),
          // Don't display actual tokens for security, just show if they exist
          tokenPreview: session.provider_token ? `${session.provider_token.substring(0, 20)}...` : 'No provider token',
        }
        
        setSessionInfo(sessionData)
        
        // Try to test Gmail API access
        if (session.provider_token) {
          testGmailAccess(session.provider_token)
        }
      } else {
        setSessionInfo({ error: 'No session found' })
      }
    } catch (err) {
      console.error('Error checking session:', err)
      setSessionInfo({ error: 'Failed to check session' })
    }
    setLoading(false)
  }

  const testGmailAccess = async (token: string) => {
    try {
      console.log('Testing Gmail API access...')
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Gmail API Success! Profile:', data)
      } else {
        console.error('Gmail API Error:', response.status, await response.text())
      }
    } catch (err) {
      console.error('Gmail API test failed:', err)
    }
  }

  if (loading) return <div>Checking session...</div>

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 className="font-semibold mb-2 text-yellow-900">🔍 Debug: Session Info</h3>
      {sessionInfo?.error ? (
        <p className="text-red-600">Error: {sessionInfo.error}</p>
      ) : (
        <div className="space-y-1 text-sm">
          <p><strong>Provider:</strong> {sessionInfo?.provider}</p>
          <p><strong>Has Google Token:</strong> {sessionInfo?.hasProviderToken ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Has Refresh Token:</strong> {sessionInfo?.hasProviderRefreshToken ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Token Preview:</strong> {sessionInfo?.tokenPreview}</p>
          <p><strong>Expires:</strong> {sessionInfo?.expiresAt}</p>
          <p className="text-xs text-gray-600 mt-2">Check browser console for full details</p>
        </div>
      )}
    </div>
  )
}
