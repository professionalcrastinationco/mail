'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { emailHistory } from '@/lib/email-history'
import { gmailTokenManager } from '@/lib/gmail/token-manager'

interface EmailMessage {
  id: string
  threadId: string
  snippet: string
  payload: {
    headers: Array<{
      name: string
      value: string
    }>
  }
  labelIds: string[]
  internalDate: string
}

interface EmailListItem {
  id: string
  from: string
  subject: string
  snippet: string
  date: string
  unread: boolean
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchEmails()
  }, [])

  const fetchEmails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get Gmail access token using the token manager
      let accessToken: string
      try {
        accessToken = await gmailTokenManager.getAccessToken()
      } catch (err) {
        console.error('Failed to get Gmail access token:', err)
        throw new Error('No Gmail access token found')
      }

      // Fetch the list of messages (just IDs)
      const listResponse = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!listResponse.ok) {
        throw new Error(`Gmail API error: ${listResponse.status}`)
      }

      const listData = await listResponse.json()
      const messageIds = listData.messages || []

      console.log(`Fetching ${messageIds.length} emails...`)

      // Batch the requests to avoid rate limiting
      const batchSize = 10
      const allEmails: EmailMessage[] = []
      
      for (let i = 0; i < messageIds.length; i += batchSize) {
        const batch = messageIds.slice(i, i + batchSize)
        console.log(`Fetching batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(messageIds.length/batchSize)}...`)
        
        const batchPromises = batch.map(async (msg: { id: string }) => {
          try {
            const response = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              }
            )
            
            if (!response.ok) {
              console.warn(`Failed to fetch email ${msg.id}: ${response.status}`)
              return null
            }
            
            return response.json()
          } catch (err) {
            console.warn(`Error fetching email ${msg.id}:`, err)
            return null
          }
        })
        
        const batchResults = await Promise.all(batchPromises)
        const validResults = batchResults.filter(email => email !== null) as EmailMessage[]
        allEmails.push(...validResults)
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < messageIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      // Transform the data into a simpler format
      const transformedEmails: EmailListItem[] = allEmails.map(email => {
        const headers = email.payload.headers || []
        const fromHeader = headers.find(h => h.name === 'From')?.value || 'Unknown'
        const subjectHeader = headers.find(h => h.name === 'Subject')?.value || '(no subject)'
        const dateHeader = headers.find(h => h.name === 'Date')?.value || ''
        
        // Extract just the name or email from the From header
        const fromMatch = fromHeader.match(/^([^<]+)<?([^>]*)>?/)
        const fromDisplay = fromMatch ? (fromMatch[1].trim() || fromMatch[2].trim()) : fromHeader

        return {
          id: email.id,
          from: fromDisplay,
          subject: subjectHeader,
          snippet: email.snippet,
          date: formatDate(dateHeader),
          unread: email.labelIds?.includes('UNREAD') || false
        }
      })

      setEmails(transformedEmails)
      console.log(`Successfully loaded ${transformedEmails.length} emails`)
    } catch (err) {
      console.error('Error fetching emails:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch emails')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 24) {
      // Today - show time
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else if (diffDays < 7) {
      // This week - show day
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else if (date.getFullYear() === now.getFullYear()) {
      // This year - show month and day
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else {
      // Older - show full date
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    }
  }

  const toggleEmailSelection = (emailId: string) => {
    const newSelected = new Set(selectedEmails)
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId)
    } else {
      newSelected.add(emailId)
    }
    setSelectedEmails(newSelected)
  }

  const selectAll = () => {
    if (selectedEmails.size === emails.length) {
      setSelectedEmails(new Set())
    } else {
      setSelectedEmails(new Set(emails.map(e => e.id)))
    }
  }

  const deleteEmails = async () => {
    if (selectedEmails.size === 0) return
    
    const confirmDelete = window.confirm(`Delete ${selectedEmails.size} email${selectedEmails.size > 1 ? 's' : ''}? This cannot be undone.`)
    if (!confirmDelete) return

    setActionLoading(true)
    
    try {
      const accessToken = await gmailTokenManager.getAccessToken()
      if (!accessToken) {
        throw new Error('No Gmail access token found')
      }

      const emailIds = Array.from(selectedEmails)
      console.log(`Deleting ${emailIds.length} emails...`)

      // Prepare history entries
      const historyEntries = emailIds.map(emailId => {
        const email = emails.find(e => e.id === emailId)
        return {
          email_id: emailId,
          action: 'delete' as const,
          action_type: 'manual' as const,
          details: email ? {
            subject: email.subject,
            from: email.from,
            snippet: email.snippet
          } : undefined
        }
      })

      // Gmail API requires batching for multiple deletes
      const batchSize = 10
      let successCount = 0
      let failCount = 0
      const successfulDeletes: typeof historyEntries = []

      for (let i = 0; i < emailIds.length; i += batchSize) {
        const batch = emailIds.slice(i, i + batchSize)
        
        const deletePromises = batch.map(async (emailId, index) => {
          try {
            const response = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}/trash`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            )
            
            if (response.ok) {
              successCount++
              const historyIndex = emailIds.indexOf(emailId)
              successfulDeletes.push(historyEntries[historyIndex])
              return true
            } else {
              console.error(`Failed to delete email ${emailId}: ${response.status}`)
              failCount++
              return false
            }
          } catch (err) {
            console.error(`Error deleting email ${emailId}:`, err)
            failCount++
            return false
          }
        })

        await Promise.all(deletePromises)
        
        // Small delay between batches
        if (i + batchSize < emailIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      console.log(`Delete complete: ${successCount} succeeded, ${failCount} failed`)

      // Track successful deletes in history
      if (successfulDeletes.length > 0) {
        await emailHistory.trackBulkActions(successfulDeletes)
      }

      // Remove deleted emails from the UI
      setEmails(prev => prev.filter(email => !selectedEmails.has(email.id)))
      setSelectedEmails(new Set())
      
      // Show result
      if (failCount === 0) {
        alert(`Successfully moved ${successCount} email${successCount > 1 ? 's' : ''} to trash!`)
      } else {
        alert(`Moved ${successCount} email${successCount > 1 ? 's' : ''} to trash. ${failCount} failed.`)
      }
    } catch (err) {
      console.error('Error deleting emails:', err)
      alert('Failed to delete emails. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const markAsRead = async () => {
    if (selectedEmails.size === 0) return
    
    setActionLoading(true)
    
    try {
      const accessToken = await gmailTokenManager.getAccessToken()
      if (!accessToken) {
        throw new Error('No Gmail access token found')
      }

      const emailIds = Array.from(selectedEmails)
      console.log(`Marking ${emailIds.length} emails as read...`)

      // Prepare history entries
      const historyEntries = emailIds.map(emailId => {
        const email = emails.find(e => e.id === emailId)
        return {
          email_id: emailId,
          action: 'mark_read' as const,
          action_type: 'manual' as const,
          details: email ? {
            subject: email.subject,
            from: email.from,
            snippet: email.snippet
          } : undefined
        }
      })

      let successCount = 0
      let failCount = 0
      const successfulReads: typeof historyEntries = []

      for (const [index, emailId] of emailIds.entries()) {
        try {
          const response = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}/modify`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                removeLabelIds: ['UNREAD']
              })
            }
          )
          
          if (response.ok) {
            successCount++
            successfulReads.push(historyEntries[index])
          } else {
            console.error(`Failed to mark email ${emailId} as read: ${response.status}`)
            failCount++
          }
        } catch (err) {
          console.error(`Error marking email ${emailId} as read:`, err)
          failCount++
        }
      }

      console.log(`Mark as read complete: ${successCount} succeeded, ${failCount} failed`)

      // Track successful actions in history
      if (successfulReads.length > 0) {
        await emailHistory.trackBulkActions(successfulReads)
      }

      // Update UI to show emails as read
      setEmails(prev => prev.map(email => {
        if (selectedEmails.has(email.id)) {
          return { ...email, unread: false }
        }
        return email
      }))
      setSelectedEmails(new Set())
      
      if (failCount === 0) {
        alert(`Marked ${successCount} email${successCount > 1 ? 's' : ''} as read!`)
      } else {
        alert(`Marked ${successCount} email${successCount > 1 ? 's' : ''} as read. ${failCount} failed.`)
      }
    } catch (err) {
      console.error('Error marking emails as read:', err)
      alert('Failed to mark emails as read. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your emails...</p>
        </div>
      </div>
    )
  }

  if (error) {
    // Check if it's a token issue
    const isTokenError = error.includes('Gmail access token') || error.includes('401')
    
    if (isTokenError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md shadow-lg">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gmail Session Expired</h3>
              <p className="text-gray-600 mb-6">Your Gmail connection needs to be refreshed. This happens periodically for security.</p>
              <div className="space-y-3">
                <button 
                  onClick={async () => {
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
                      console.error('Re-auth error:', error)
                      alert('Failed to reconnect to Gmail')
                    }
                  }}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Reconnect to Gmail
                </button>
                <button 
                  onClick={fetchEmails}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    // Other errors
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error loading emails</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchEmails}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      {/* Header */}
      <div className="shadow-sm border-b" style={{ backgroundColor: 'white', borderColor: '#cad5e2' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold" style={{ color: '#0f172b' }}>Inbox</h1>
              <span className="text-sm" style={{ color: '#45556c' }}>
                {emails.length} emails
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b px-4 py-2" style={{ backgroundColor: 'white', borderColor: '#cad5e2' }}>
        <div className="max-w-7xl mx-auto flex items-center space-x-4">
          <input
            type="checkbox"
            checked={selectedEmails.size === emails.length && emails.length > 0}
            onChange={selectAll}
            className="rounded"
            style={{ borderColor: '#cad5e2' }}
          />
          {selectedEmails.size > 0 && (
            <>
              <button 
                className="text-sm px-3 py-1 border rounded hover:opacity-90" 
                style={{ borderColor: '#cad5e2', backgroundColor: 'white' }}
                disabled={actionLoading}
              >
                Archive
              </button>
              <button 
                onClick={deleteEmails}
                disabled={actionLoading}
                className="text-sm px-3 py-1 border rounded hover:opacity-90" 
                style={{ 
                  borderColor: '#cad5e2', 
                  backgroundColor: actionLoading ? '#f1f5f9' : 'white',
                  cursor: actionLoading ? 'wait' : 'pointer' 
                }}
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
              <button 
                onClick={markAsRead}
                disabled={actionLoading}
                className="text-sm px-3 py-1 border rounded hover:opacity-90" 
                style={{ 
                  borderColor: '#cad5e2', 
                  backgroundColor: actionLoading ? '#f1f5f9' : 'white',
                  cursor: actionLoading ? 'wait' : 'pointer' 
                }}
              >
                {actionLoading ? 'Updating...' : 'Mark as Read'}
              </button>
              <span className="text-sm" style={{ color: '#45556c' }}>
                {selectedEmails.size} selected
              </span>
            </>
          )}
        </div>
      </div>

      {/* Email List */}
      <div className="max-w-7xl mx-auto">
        <div className="shadow-sm" style={{ backgroundColor: 'white' }}>
          {emails.length === 0 ? (
            <div className="p-8 text-center" style={{ color: '#45556c' }}>
              No emails found
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#cad5e2' }}>
              {emails.map((email) => (
                <div
                  key={email.id}
                  className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                    email.unread ? '' : 'opacity-75'
                  }`}
                  style={{ 
                    backgroundColor: email.unread ? 'white' : '#f9fafb',
                    borderColor: '#e5e7eb'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = email.unread ? 'white' : '#f9fafb'}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedEmails.has(email.id)}
                    onChange={() => toggleEmailSelection(email.id)}
                    className="mr-4 rounded border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  {/* From column - fixed width */}
                  <div className="w-48 mr-4 flex-shrink-0">
                    <span className={`text-sm truncate block ${
                      email.unread ? 'font-semibold text-gray-900' : 'text-gray-700'
                    }`}>
                      {email.from}
                    </span>
                  </div>
                  
                  {/* Subject and snippet - flexible width */}
                  <div className="flex-1 min-w-0 mr-4">
                    <div className={`text-sm truncate ${
                      email.unread ? 'font-semibold text-gray-900' : 'text-gray-700'
                    }`}>
                      {email.subject}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {email.snippet}
                    </div>
                  </div>
                  
                  {/* Date column - fixed width, right-aligned */}
                  <div className="w-24 text-right flex-shrink-0">
                    <span className="text-sm text-gray-500">
                      {email.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
