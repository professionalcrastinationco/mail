'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Shield, AlertTriangle, Plus } from 'lucide-react'

interface SafeSender {
  id: string
  email_address: string
  added_at: string
}

interface UserSettings {
  safe_senders_required: boolean
  safe_senders_count: number
  training_mode_active: boolean
}

export default function SafeSendersPage() {
  const [safeSenders, setSafeSenders] = useState<SafeSender[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [redirectedFromSuperAction, setRedirectedFromSuperAction] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Check if we were redirected from a Super Action attempt
    const params = new URLSearchParams(window.location.search)
    if (params.get('from') === 'super-action') {
      setRedirectedFromSuperAction(true)
    }
    
    loadSafeSenders()
    loadUserSettings()
  }, [])

  const loadSafeSenders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('safe_senders')
        .select('*')
        .order('added_at', { ascending: false })

      if (error) throw error
      setSafeSenders(data || [])
    } catch (err) {
      console.error('Error loading safe senders:', err)
      setError('Failed to load safe senders')
    } finally {
      setLoading(false)
    }
  }

  const loadUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (!data) {
        // Create default settings if they don't exist
        const { data: newSettings } = await supabase
          .from('user_settings')
          .insert([{
            user_id: user.id,
            safe_senders_required: true,
            safe_senders_count: 0,
            training_mode_active: true
          }])
          .select()
          .single()
        
        setUserSettings(newSettings)
      } else {
        setUserSettings(data)
      }
    } catch (err) {
      console.error('Error loading user settings:', err)
    }
  }

  const validateEmailPattern = (pattern: string): boolean => {
    // Check for valid patterns:
    // 1. Exact email: user@domain.com
    // 2. Domain wildcard: *@domain.com
    // 3. Prefix wildcard: noreply@*
    // 4. Contains @ symbol
    if (!pattern.includes('@')) return false
    
    const parts = pattern.split('@')
    if (parts.length !== 2) return false
    
    const [localPart, domain] = parts
    
    // Check if it's a valid pattern
    if (localPart === '*' && domain && domain !== '*') return true  // *@domain.com
    if (localPart && localPart !== '*' && domain === '*') return true  // user@*
    if (localPart && localPart !== '*' && domain && domain !== '*') {  // regular email
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(pattern)
    }
    
    return false
  }

  const addSafeSender = async () => {
    if (!newEmail) {
      setError('Please enter an email address or pattern')
      return
    }
    
    if (!validateEmailPattern(newEmail)) {
      setError('Please enter a valid email address or pattern (e.g., user@domain.com, *@domain.com, user@*)')
      return
    }

    setAdding(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if already exists
      const exists = safeSenders.some(s => s.email_address.toLowerCase() === newEmail.toLowerCase())
      if (exists) {
        setError('This email is already in your safe senders list')
        setAdding(false)
        return
      }

      const { data, error } = await supabase
        .from('safe_senders')
        .insert([{
          user_id: user.id,
          email_address: newEmail.toLowerCase()
        }])
        .select()
        .single()

      if (error) throw error

      setSafeSenders([data, ...safeSenders])
      setNewEmail('')
      
      // Update count in state
      if (userSettings) {
        setUserSettings({
          ...userSettings,
          safe_senders_count: userSettings.safe_senders_count + 1
        })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add safe sender')
    } finally {
      setAdding(false)
    }
  }

  const removeSafeSender = async (id: string) => {
    if (!confirm('Remove this email from your safe senders list?')) return

    try {
      const { error } = await supabase
        .from('safe_senders')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSafeSenders(safeSenders.filter(s => s.id !== id))
      
      // Update count in state
      if (userSettings) {
        setUserSettings({
          ...userSettings,
          safe_senders_count: Math.max(0, userSettings.safe_senders_count - 1)
        })
      }
    } catch (err) {
      console.error('Error removing safe sender:', err)
      setError('Failed to remove safe sender')
    }
  }

  const canUseSuperActions = userSettings && (
    !userSettings.safe_senders_required || userSettings.safe_senders_count >= 3
  )

  const remainingRequired = userSettings 
    ? Math.max(0, 3 - userSettings.safe_senders_count)
    : 3

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Alert banner if redirected from Super Action */}
      {redirectedFromSuperAction && !canUseSuperActions && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg animate-pulse">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Hold up there, cowboy
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                You need to add at least 3 email addresses to your Safe Senders list before you can start nuking emails. 
                These addresses will NEVER be touched by Super Actions.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-blue-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Safe Senders List
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Emails from these addresses will never be affected by Super Actions
                </p>
              </div>
            </div>
            {userSettings && (
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Currently Protected
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userSettings.safe_senders_count}/3
                  {userSettings.safe_senders_count >= 3 && (
                    <span className="text-sm font-normal text-green-600 dark:text-green-400 ml-2">
                      ✓ Required
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Add new safe sender */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add Email Address or Pattern
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Supports: exact@email.com, *@domain.com, prefix@*
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSafeSender()}
                placeholder="boss@company.com or *@company.com"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={adding}
              />
              <button
                onClick={addSafeSender}
                disabled={adding || !newEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          {/* Remaining required notice */}
          {remainingRequired > 0 && userSettings?.safe_senders_required && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Add {remainingRequired} more email{remainingRequired !== 1 ? 's' : ''} to unlock Super Actions
              </p>
            </div>
          )}

          {/* Safe senders list */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : safeSenders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                No safe senders added yet
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Add important email addresses like your boss, spouse, or lawyer
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Tip: Use wildcards like *@company.com to protect entire domains
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {safeSenders.map((sender) => (
                <div
                  key={sender.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {sender.email_address}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Added {new Date(sender.added_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeSafeSender(sender.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Remove from safe senders"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action button */}
          {canUseSuperActions && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => router.push('/emails')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Continue to Super Actions
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings link */}
      <div className="mt-6 text-center">
        <button
          onClick={() => router.push('/rules/settings')}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Advanced Settings & Training Mode
        </button>
      </div>
    </div>
  )
}