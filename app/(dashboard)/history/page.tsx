'use client'

import { useState, useEffect } from 'react'
import { emailHistory } from '@/lib/email-history'

interface HistoryItem {
  id: string
  email_id: string
  thread_id?: string
  action: string
  action_type: 'manual' | 'automated'
  details: {
    subject?: string
    from?: string
    snippet?: string
    ruleName?: string
    [key: string]: any
  }
  created_at: string
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'manual' | 'automated'>('all')

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await emailHistory.getHistory(200) // Get up to 200 recent items
      setHistory(data as HistoryItem[])
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'delete': return '🗑️'
      case 'archive': return '📦'
      case 'mark_read': return '✓'
      case 'mark_unread': return '○'
      case 'apply_rule': return '⚙️'
      case 'unsubscribe': return '🚫'
      default: return '📧'
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'delete': return 'Deleted'
      case 'archive': return 'Archived'
      case 'mark_read': return 'Marked as Read'
      case 'mark_unread': return 'Marked as Unread'
      case 'apply_rule': return 'Applied Rule'
      case 'unsubscribe': return 'Unsubscribed'
      default: return action
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true
    return item.action_type === filter
  })

  // Group history by time periods
  const groupedHistory = filteredHistory.reduce((groups, item) => {
    const date = new Date(item.created_at)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    let group = 'Older'
    if (diffHours < 1) group = 'Last Hour'
    else if (diffHours < 24) group = 'Today'
    else if (diffHours < 48) group = 'Yesterday'
    else if (diffHours < 168) group = 'This Week'
    
    if (!groups[group]) groups[group] = []
    groups[group].push(item)
    return groups
  }, {} as Record<string, HistoryItem[]>)

  const groupOrder = ['Last Hour', 'Today', 'Yesterday', 'This Week', 'Older']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading history...</p>
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
              <h1 className="text-xl font-semibold" style={{ color: '#0f172b' }}>History</h1>
              <span className="text-sm" style={{ color: '#45556c' }}>
                Last 7 days of email actions
              </span>
            </div>
            <button
              onClick={loadHistory}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              style={{ borderColor: '#cad5e2' }}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex space-x-2">
          {(['all', 'manual', 'automated'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === type 
                  ? 'text-white' 
                  : 'hover:bg-gray-100'
              }`}
              style={{
                backgroundColor: filter === type ? '#0f172b' : 'white',
                color: filter === type ? 'white' : '#45556c',
                border: `1px solid ${filter === type ? '#0f172b' : '#cad5e2'}`
              }}
            >
              {type === 'all' ? 'All Actions' : 
               type === 'manual' ? '👤 Manual' : '🤖 Automated'}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center" style={{ color: '#45556c' }}>
            <p className="text-lg mb-2">No history yet</p>
            <p className="text-sm">Email actions will appear here as you use the app</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupOrder.map(group => {
              const items = groupedHistory[group]
              if (!items || items.length === 0) return null
              
              return (
                <div key={group}>
                  <h2 className="text-sm font-semibold mb-2" style={{ color: '#45556c' }}>
                    {group}
                  </h2>
                  <div className="bg-white rounded-lg shadow-sm divide-y" style={{ borderColor: '#cad5e2' }}>
                    {items.map(item => (
                      <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl mt-1">{getActionIcon(item.action)}</span>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium" style={{ color: '#0f172b' }}>
                                  {getActionLabel(item.action)}
                                </span>
                                <span 
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: item.action_type === 'manual' ? '#e0f2fe' : '#fef3c7',
                                    color: item.action_type === 'manual' ? '#075985' : '#92400e'
                                  }}
                                >
                                  {item.action_type === 'manual' ? 'Manual' : 'Automated'}
                                </span>
                              </div>
                              {item.details?.subject && (
                                <p className="text-sm mt-1" style={{ color: '#314158' }}>
                                  {item.details.subject}
                                </p>
                              )}
                              {item.details?.from && (
                                <p className="text-xs mt-1" style={{ color: '#45556c' }}>
                                  From: {item.details.from}
                                </p>
                              )}
                              {item.details?.ruleName && (
                                <p className="text-xs mt-1" style={{ color: '#45556c' }}>
                                  Rule: {item.details.ruleName}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs whitespace-nowrap" style={{ color: '#45556c' }}>
                            {formatTime(item.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}