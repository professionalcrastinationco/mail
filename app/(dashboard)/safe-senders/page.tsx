// Save this as: app/(dashboard)/safe-senders/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SafeSender {
  id: string
  email_address: string
  added_at: string
}

export default function SafeSendersPage() {
  const [safeSenders, setSafeSenders] = useState<SafeSender[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSafeSenders()
  }, [])

  const loadSafeSenders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('safe_senders')
        .select('*')
        .order('added_at', { ascending: false })

      if (error) throw error
      setSafeSenders(data || [])
    } catch (error) {
      console.error('Error loading safe senders:', error)
    } finally {
      setLoading(false)
    }
  }

  const addSafeSender = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) return

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail.trim())) {
      alert('Please enter a valid email address')
      return
    }

    setAdding(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('safe_senders')
        .insert({
          user_id: userData.user.id,
          email_address: newEmail.trim().toLowerCase()
        })

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          alert('This email is already in your safe senders list')
        } else {
          throw error
        }
      } else {
        setNewEmail('')
        await loadSafeSenders()
      }
    } catch (error) {
      console.error('Error adding safe sender:', error)
      alert('Failed to add safe sender')
    } finally {
      setAdding(false)
    }
  }

  const removeSafeSender = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from safe senders?`)) return

    try {
      const { error } = await supabase
        .from('safe_senders')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadSafeSenders()
    } catch (error) {
      console.error('Error removing safe sender:', error)
      alert('Failed to remove safe sender')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading safe senders...</p>
        </div>
      </div>
    )
  }

  const needsMoreSenders = safeSenders.length < 3

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      {/* Header */}
      <div className="shadow-sm border-b" style={{ backgroundColor: 'white', borderColor: '#cad5e2' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold" style={{ color: '#0f172b' }}>Safe Senders</h1>
              <span className="text-sm" style={{ color: '#45556c' }}>
                {safeSenders.length} protected sender{safeSenders.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Box */}
        <div className={`rounded-lg p-6 mb-8 ${needsMoreSenders ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-blue-50'}`}>
          <div className="flex items-start space-x-3">
            <span className="text-2xl">{needsMoreSenders ? '⚠️' : '🛡️'}</span>
            <div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: '#0f172b' }}>
                {needsMoreSenders ? 'Add More Safe Senders' : 'Safe Senders Protected'}
              </h2>
              <p className="text-sm mb-3" style={{ color: '#45556c' }}>
                Safe senders are email addresses that will never be affected by Super Actions. 
                Add important contacts like family, boss, or critical services.
              </p>
              {needsMoreSenders && (
                <p className="text-sm font-medium" style={{ color: '#92400e' }}>
                  ⚡ You need at least 3 safe senders to use Super Actions. Add {3 - safeSenders.length} more.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Add Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#0f172b' }}>
            Add Safe Sender
          </h3>
          <form onSubmit={addSafeSender} className="flex space-x-3">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: '#cad5e2' }}
              disabled={adding}
            />
            <button
              type="submit"
              disabled={adding || !newEmail.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>

        {/* Safe Senders List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b" style={{ borderColor: '#cad5e2' }}>
            <h3 className="text-lg font-semibold" style={{ color: '#0f172b' }}>
              Current Safe Senders
            </h3>
          </div>
          
          {safeSenders.length === 0 ? (
            <div className="p-8 text-center" style={{ color: '#45556c' }}>
              <p className="text-lg mb-2">No safe senders yet</p>
              <p className="text-sm">Add email addresses you want to protect from automated actions</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#cad5e2' }}>
              {safeSenders.map((sender) => (
                <div key={sender.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-medium" style={{ color: '#0f172b' }}>
                      {sender.email_address}
                    </p>
                    <p className="text-xs" style={{ color: '#45556c' }}>
                      Added {new Date(sender.added_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeSafeSender(sender.id, sender.email_address)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggestions */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold mb-3" style={{ color: '#0f172b' }}>
            💡 Suggested Safe Senders
          </h4>
          <ul className="space-y-2 text-sm" style={{ color: '#45556c' }}>
            <li>• Your boss or manager's email</li>
            <li>• Family members (spouse, parents, kids)</li>
            <li>• Your bank or financial institutions</li>
            <li>• Healthcare providers</li>
            <li>• Government agencies (IRS, DMV, etc.)</li>
            <li>• Your own alternate email addresses</li>
          </ul>
        </div>
      </div>
    </div>
  )
}