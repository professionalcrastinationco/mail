import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const supabase = await createClient()
  
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>
          
          <div className="space-y-8">
            {/* Profile Section */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
                  <p className="text-gray-500 text-sm font-mono">{user.id}</p>
                </div>
              </div>
            </div>

            {/* Email Preferences */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Preferences</h2>
              <p className="text-gray-600 mb-4">Configure how Mail Relief handles your emails</p>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 mr-3" defaultChecked />
                  <span className="text-gray-700">Auto-generate draft replies</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 mr-3" defaultChecked />
                  <span className="text-gray-700">Track subscription emails</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 mr-3" />
                  <span className="text-gray-700">Send daily summary emails</span>
                </label>
              </div>
            </div>

            {/* AI Settings */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Reply Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Tone</label>
                  <select className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option>Professional</option>
                    <option>Friendly</option>
                    <option>Casual</option>
                    <option>Formal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reply Length</label>
                  <select className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option>Brief (1-2 sentences)</option>
                    <option>Standard (3-5 sentences)</option>
                    <option>Detailed (Full paragraph)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div>
              <h2 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h2>
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <p className="text-gray-700 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
