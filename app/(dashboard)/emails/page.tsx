'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

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
  const supabase = createClient()

  useEffect(() => {
    fetchEmails()
  }, [])

  const fetchEmails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get the session with provider token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.provider_token) {
        throw new Error('No Gmail access token found')
      }

      // Fetch the list of messages (just IDs)
      const listResponse = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50',
        {
          headers: {
            'Authorization': `Bearer ${session.provider_token}`
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
                  'Authorization': `Bearer ${session.provider_token}`
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
              <Link href="/dashboard" className="hover:opacity-80" style={{ color: '#45556c' }}>
                ← Back
              </Link>
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
              <button className="text-sm px-3 py-1 border rounded hover:opacity-90" style={{ borderColor: '#cad5e2', backgroundColor: 'white' }}>
                Archive
              </button>
              <button className="text-sm px-3 py-1 border rounded hover:opacity-90" style={{ borderColor: '#cad5e2', backgroundColor: 'white' }}>
                Delete
              </button>
              <button className="text-sm px-3 py-1 border rounded hover:opacity-90" style={{ borderColor: '#cad5e2', backgroundColor: 'white' }}>
                Mark as Read
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
                    backgroundColor: email.unread ? 'white' : '#f1f5f9',
                    borderColor: '#cad5e2'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = email.unread ? 'white' : '#f1f5f9'}
                >
                  <input
                    type="checkbox"
                    checked={selectedEmails.has(email.id)}
                    onChange={() => toggleEmailSelection(email.id)}
                    className="mr-4 rounded"
                    style={{ borderColor: '#cad5e2' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center mb-1">
                          <span className={`text-sm truncate ${
                            email.unread ? 'font-semibold' : ''
                          }`} style={{ color: email.unread ? '#0f172b' : '#314158' }}>
                            {email.from}
                          </span>
                        </div>
                        <div className={`text-sm ${
                          email.unread ? 'font-semibold' : ''
                        }`} style={{ color: email.unread ? '#1d293d' : '#314158' }}>
                          {email.subject}
                        </div>
                        <div className="text-sm truncate" style={{ color: '#45556c' }}>
                          {email.snippet}
                        </div>
                      </div>
                      <div className="text-sm whitespace-nowrap ml-2" style={{ color: '#45556c' }}>
                        {email.date}
                      </div>
                    </div>
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
