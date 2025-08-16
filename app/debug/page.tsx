'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function DebugAuth() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const supabase = createClient()
    
    const checkAuth = async () => {
      try {
        // Try to get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setError(`Session error: ${sessionError.message}`)
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        // Also try refreshing the session
        if (!session) {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError) {
            setError(`Refresh error: ${refreshError.message}`)
          } else if (refreshedSession) {
            setSession(refreshedSession)
            setUser(refreshedSession.user)
          }
        }
        
        // Also check user directly
        const { data: { user: directUser }, error: userError } = await supabase.auth.getUser()
        if (userError && userError.message !== 'Auth session missing!') {
          setError(`User error: ${userError.message}`)
        }
        
        setLoading(false)
      } catch (err) {
        setError(`Unexpected error: ${err}`)
        setLoading(false)
      }
    }
    
    checkAuth()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session)
      setSession(session)
      setUser(session?.user ?? null)
    })
    
    return () => subscription.unsubscribe()
  }, [])
  
  const handleManualLogin = () => {
    window.location.href = '/login'
  }
  
  const handleGoogleLogin = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/gmail.modify',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) {
      setError(`OAuth error: ${error.message}`)
    }
  }
  
  if (loading) return <div className="p-8">Loading auth state...</div>
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          <h2 className="font-semibold">Error:</h2>
          <pre>{error}</pre>
        </div>
      )}
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">User Status:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {user ? 'LOGGED IN' : 'NOT LOGGED IN'}
        </pre>
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">User Data:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Session Data:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Cookies:</h2>
        <pre className="bg-gray-100 p-4 rounded text-xs">
          Check DevTools → Application → Cookies
        </pre>
      </div>
      
      <div className="flex gap-4 flex-wrap">
        <button 
          onClick={handleGoogleLogin}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Try Google Login Again
        </button>
        <button 
          onClick={handleManualLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Go to Login Page
        </button>
        <a href="/dashboard" className="bg-purple-500 text-white px-4 py-2 rounded">
          Try Dashboard
        </a>
        <a href="/" className="bg-gray-500 text-white px-4 py-2 rounded">
          Go Home
        </a>
        <button 
          onClick={async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            window.location.reload()
          }}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}