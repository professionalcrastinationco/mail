import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import GmailTest from './gmail-test'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.email}</span>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GmailTest />
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 mt-6">
          <h2 className="text-2xl font-bold mb-4">Welcome to your Dashboard!</h2>
          <p className="text-gray-600 mb-4">
            You are successfully authenticated and can access protected routes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">User Information</h3>
              <p className="text-sm text-gray-600">Email: {user.email}</p>
              <p className="text-sm text-gray-600">User ID: {user.id}</p>
              <p className="text-sm text-gray-600">Provider: {user.app_metadata?.provider || 'email'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Session Details</h3>
              <p className="text-sm text-gray-600">Created: {new Date(user.created_at || '').toLocaleDateString()}</p>
              <p className="text-sm text-gray-600">Last Sign In: {new Date(user.last_sign_in_at || '').toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Email Management</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/emails" className="text-blue-600 hover:text-blue-700 font-medium">
                  📧 View Inbox
                </Link>
              </li>
              <li>
                <Link href="/dashboard/profile" className="text-blue-600 hover:text-blue-700">
                  Edit Profile
                </Link>
              </li>
              <li>
                <Link href="/dashboard/settings" className="text-blue-600 hover:text-blue-700">
                  Account Settings
                </Link>
              </li>
              <li>
                <Link href="/dashboard/billing" className="text-blue-600 hover:text-blue-700">
                  Billing Information
                </Link>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
            <p className="text-gray-600 text-sm">No recent activity to display.</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/docs" className="text-blue-600 hover:text-blue-700">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-blue-600 hover:text-blue-700">
                  Support Center
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-blue-600 hover:text-blue-700">
                  API Reference
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}