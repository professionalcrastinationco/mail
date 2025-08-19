import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home({
  searchParams,
}: {
  searchParams: { code?: string; error?: string }
}) {
  const supabase = await createClient()
  
  // Handle OAuth callback if code is present
  if (searchParams.code) {
    console.log('OAuth code received:', searchParams.code)
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(searchParams.code)
      if (error) {
        console.error('Code exchange failed:', error)
        // Don't redirect on error, show the page
      } else {
        console.log('Code exchange successful, redirecting to dashboard')
        redirect('/dashboard')
      }
    } catch (err) {
      console.error('Unexpected error exchanging code:', err)
    }
  }
  
  // Check if user is already logged in
  const { data: { user }, error: getUserError } = await supabase.auth.getUser()
  
  if (getUserError) {
    console.log('Get user error:', getUserError)
  }
  
  if (user) {
    console.log('User found, redirecting to dashboard:', user.email)
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {searchParams.code && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <p>Processing authentication... If you're not redirected, <Link href="/login" className="underline">click here</Link></p>
        </div>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-8">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Get to Inbox Zero
            </span>
            <br />
            <span className="text-gray-900">with AI Power</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Let AI manage your Gmail inbox. Mass delete, auto-reply, track subscriptions, and save hours every week.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
              Start Free Trial
            </Link>
            <Link href="/features" className="inline-block bg-white text-gray-700 px-8 py-3 rounded-lg text-lg font-medium border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200">
              See How It Works
            </Link>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200 border border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🧹</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Inbox Zero, Finally</h3>
            <p className="text-gray-600">Mass delete, archive, and unsubscribe with smart AI-powered rules that actually work.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200 border border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Smart Auto-Reply</h3>
            <p className="text-gray-600">AI drafts personalized replies that match your tone and style. Just review and send.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200 border border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Track Your Money</h3>
            <p className="text-gray-600">Find hidden subscriptions and track recurring charges you forgot about.</p>
          </div>
        </div>
      </section>
    </div>
  );
}