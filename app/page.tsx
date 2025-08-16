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
      
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Gmail Assistant</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/features" className="text-gray-700 hover:text-gray-900">Features</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-gray-900">Pricing</Link>
              <Link href="/faq" className="text-gray-700 hover:text-gray-900">FAQ</Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900">Contact</Link>
              <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Sign In</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-8">
            Get to Inbox Zero with AI
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Let AI manage your Gmail inbox. Mass delete, auto-reply, track subscriptions, and save hours every week.
          </p>
          <div className="space-x-4">
            <Link href="/signup" className="bg-blue-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-blue-700">
              Get Started
            </Link>
            <Link href="/features" className="bg-white text-blue-600 px-8 py-3 rounded-md text-lg font-medium border-2 border-blue-600 hover:bg-blue-50">
              Learn More
            </Link>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">🧹 Inbox Zero</h3>
            <p className="text-gray-600">Mass delete, archive, and unsubscribe with smart AI-powered rules.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">💬 Auto-Reply</h3>
            <p className="text-gray-600">AI drafts personalized replies that match your tone and style.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">💰 Track Spending</h3>
            <p className="text-gray-600">Find and manage all your subscriptions and recurring charges.</p>
          </div>
        </div>
      </main>
    </div>
  );
}