// components/super-actions/SuperActionsDropdown.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import LastChancePopup from './LastChancePopup'
import { toast } from '@/components/ui/Toast'

interface SuperActionsDropdownProps {
  selectedEmails: Set<string>
  allEmails: Array<{
    id: string
    from: string
    subject: string
    snippet: string
    date: string
  }>
  onActionComplete: () => void
}

export default function SuperActionsDropdown({ 
  selectedEmails, 
  allEmails,
  onActionComplete 
}: SuperActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [pendingAction, setPendingAction] = useState<any>(null)
  const [canUseSuperActions, setCanUseSuperActions] = useState(false)
  const [safeSendersCount, setSafeSendersCount] = useState(0)
  const [processing, setProcessing] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    checkSuperActionsAccess()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const checkSuperActionsAccess = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      // Check safe senders count
      const { data: safeSenders, error } = await supabase
        .from('safe_senders')
        .select('id')
        .eq('user_id', userData.user.id)

      if (!error && safeSenders) {
        setSafeSendersCount(safeSenders.length)
        setCanUseSuperActions(safeSenders.length >= 3)
      }
    } catch (error) {
      console.error('Error checking Super Actions access:', error)
    }
  }

  const superActions = [
    {
      id: 'delete-sender',
      label: '🗑️ Delete all from sender',
      description: 'Delete ALL emails from the sender(s) of selected emails',
      requiresSelection: true,
      action: 'delete_by_sender'
    },
    {
      id: 'delete-old-30',
      label: '📅 Delete older than 30 days',
      description: 'Delete emails older than 30 days',
      requiresSelection: false,
      action: 'delete_old',
      days: 30
    },
    {
      id: 'delete-old-90',
      label: '📅 Delete older than 90 days',
      description: 'Delete emails older than 90 days',
      requiresSelection: false,
      action: 'delete_old',
      days: 90
    },
    {
      id: 'archive-sender',
      label: '📦 Archive all from sender',
      description: 'Archive ALL emails from the sender(s) of selected emails',
      requiresSelection: true,
      action: 'archive_by_sender'
    },
    {
      id: 'archive-old-30',
      label: '📦 Archive older than 30 days',
      description: 'Archive emails older than 30 days',
      requiresSelection: false,
      action: 'archive_old',
      days: 30
    },
    {
      id: 'unsubscribe-sender',
      label: '🚫 Unsubscribe & Delete',
      description: 'Unsubscribe and delete ALL from the sender(s)',
      requiresSelection: true,
      action: 'unsubscribe_and_delete'
    }
  ]

  const handleActionClick = async (action: any) => {
    if (!canUseSuperActions) {
      toast.warning(
        'Setup Required', 
        `You need at least 3 safe senders to use Super Actions. You currently have ${safeSendersCount}.`
      )
      setTimeout(() => {
        window.location.href = '/safe-senders'
      }, 2000)
      return
    }

    if (action.requiresSelection && selectedEmails.size === 0) {
      toast.info('Select emails first', 'Please select at least one email to perform this action')
      return
    }

    // Prepare action details
    const actionDetails: any = {
      action: action.action,
      actionLabel: action.label,
      description: action.description,
      days: action.days,
      selectedCount: selectedEmails.size,
      estimatedAffected: 0,
      sendersList: [] as string[]
    }

    // Calculate estimated affected emails
    if (action.action === 'delete_by_sender' || action.action === 'archive_by_sender' || action.action === 'unsubscribe_and_delete') {
      const selectedEmailDetails = allEmails.filter(e => selectedEmails.has(e.id))
      const uniqueSenders = new Set(selectedEmailDetails.map(e => e.from))
      actionDetails.sendersList = Array.from(uniqueSenders)
      
      // Find ALL emails from these senders (not just selected ones)
      const affectedEmails = allEmails.filter(e => {
        return Array.from(uniqueSenders).some(sender => e.from === sender)
      })
      actionDetails.estimatedAffected = affectedEmails.length
      
      // Update description to be clearer
      const senderCount = uniqueSenders.size
      const senderText = senderCount === 1 ? '1 sender' : `${senderCount} senders`
      
      if (action.action === 'delete_by_sender') {
        actionDetails.description = `Delete ALL emails from ${senderText} (${affectedEmails.length} total emails, not just the ${selectedEmails.size} selected)`
      } else if (action.action === 'archive_by_sender') {
        actionDetails.description = `Archive ALL emails from ${senderText} (${affectedEmails.length} total emails, not just the ${selectedEmails.size} selected)`
      } else {
        actionDetails.description = `Unsubscribe and delete ALL emails from ${senderText} (${affectedEmails.length} total emails, not just the ${selectedEmails.size} selected)`
      }
    } else if (action.action === 'delete_old' || action.action === 'archive_old') {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - action.days)
      const affectedEmails = allEmails.filter(e => new Date(e.date) < cutoffDate)
      actionDetails.estimatedAffected = affectedEmails.length
    }

    setPendingAction(actionDetails)
    setShowWarning(true)
    setIsOpen(false)
  }

  const executeAction = async () => {
    if (!pendingAction) return
    
    setProcessing(true)
    setShowWarning(false)

    try {
      // Call the API endpoint for Super Actions
      const response = await fetch('/api/super-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: pendingAction.action,
          selectedEmailIds: Array.from(selectedEmails),
          days: pendingAction.days,
          allEmails: allEmails
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(
          `Processed ${result.processedCount} emails`,
          result.message
        )
        onActionComplete()
      } else {
        toast.error('Action failed', result.error)
      }
    } catch (error) {
      console.error('Super Action failed:', error)
      toast.error('Failed to execute Super Action', 'Please try again')
    } finally {
      setProcessing(false)
      setPendingAction(null)
    }
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={processing}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
            canUseSuperActions 
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600' 
              : 'bg-gray-300 text-gray-700 cursor-not-allowed'
          } ${processing ? 'opacity-50 cursor-wait' : ''}`}
        >
          <span>⚡</span>
          <span>Super Actions</span>
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            {!canUseSuperActions ? (
              <div className="p-4">
                <div className="flex items-center space-x-2 text-amber-600 mb-3">
                  <span>⚠️</span>
                  <span className="font-semibold">Setup Required</span>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Add {3 - safeSendersCount} more safe sender{3 - safeSendersCount !== 1 ? 's' : ''} to unlock Super Actions.
                </p>
                <a 
                  href="/safe-senders"
                  className="block w-full bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700 transition"
                >
                  Go to Safe Senders
                </a>
              </div>
            ) : (
              <div className="py-2">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-700 font-medium">BULK EMAIL ACTIONS</p>
                </div>
                {superActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleActionClick(action)}
                    disabled={action.requiresSelection && selectedEmails.size === 0}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      action.requiresSelection && selectedEmails.size === 0 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-xl mt-0.5">{action.label.split(' ')[0]}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {action.label.substring(action.label.indexOf(' ') + 1)}
                        </div>
                        <div className="text-sm text-gray-700 mt-0.5">
                          {action.description}
                        </div>
                        {action.requiresSelection && selectedEmails.size > 0 && (action.id.includes('sender') || action.id.includes('unsubscribe')) && (
                          <div className="text-xs text-blue-600 mt-1">
                            {(() => {
                              const selectedEmailDetails = allEmails.filter(e => selectedEmails.has(e.id))
                              const uniqueSenders = new Set(selectedEmailDetails.map(e => e.from))
                              const totalFromSenders = allEmails.filter(e => 
                                Array.from(uniqueSenders).some(sender => e.from === sender)
                              ).length
                              
                              if (totalFromSenders > selectedEmails.size) {
                                return `${selectedEmails.size} selected → ${totalFromSenders} total emails from these sender(s)`
                              }
                              return `Will affect ${selectedEmails.size} email${selectedEmails.size > 1 ? 's' : ''}`
                            })()}
                          </div>
                        )}
                        {action.requiresSelection && selectedEmails.size > 0 && !action.id.includes('sender') && !action.id.includes('unsubscribe') && (
                          <div className="text-xs text-blue-600 mt-1">
                            Will affect {selectedEmails.size} selected email{selectedEmails.size > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showWarning && pendingAction && (
        <LastChancePopup
          isOpen={showWarning}
          onClose={() => setShowWarning(false)}
          onConfirm={executeAction}
          actionType={pendingAction.action}
          affectedCount={pendingAction.estimatedAffected}
          actionDescription={pendingAction.description}
          sendersList={pendingAction.sendersList}
          selectedCount={pendingAction.selectedCount}
        />
      )}

      {processing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
              <p className="text-lg font-semibold text-gray-900">Processing Super Action...</p>
              <p className="text-sm text-gray-700 mt-2">This might take a moment for large batches</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}