'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

interface EmailPreview {
  id: string
  from: string
  subject: string
  date: string
}

interface SuperActionOptions {
  current: boolean
  past: boolean
  future: boolean
}

interface LastChancePopupProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (options: SuperActionOptions) => void
  actionType: 'delete' | 'archive' | 'unsubscribe'
  senderEmail: string
  affectedCount?: number
  emailPreviews?: EmailPreview[]
  loading?: boolean
}

export default function LastChancePopup({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  senderEmail,
  affectedCount = 0,
  emailPreviews = [],
  loading = false
}: LastChancePopupProps) {
  const [options, setOptions] = useState<SuperActionOptions>({
    current: true,
    past: true,
    future: true
  })
  const [showPreviews, setShowPreviews] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  useEffect(() => {
    // Reset state when popup opens
    if (isOpen) {
      setOptions({ current: true, past: true, future: true })
      setShowPreviews(false)
      setConfirmText('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const getActionVerb = () => {
    switch (actionType) {
      case 'delete': return 'DELETE'
      case 'archive': return 'ARCHIVE'
      case 'unsubscribe': return 'UNSUBSCRIBE'
    }
  }

  const getActionDescription = () => {
    switch (actionType) {
      case 'delete': return 'permanently delete'
      case 'archive': return 'archive'
      case 'unsubscribe': return 'unsubscribe from and delete'
    }
  }

  const handleConfirm = () => {
    // Check if at least one option is selected
    if (!options.current && !options.past && !options.future) {
      alert('Since you unchecked all boxes, nothing will happen. Select at least one option.')
      return
    }

    // For mass deletions, require confirmation text
    if (affectedCount > 100 && confirmText !== getActionVerb()) {
      alert(`Type "${getActionVerb()}" to confirm this action`)
      return
    }

    onConfirm(options)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                SUPER {getActionVerb()} - Hold Up
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                This affects: <span className="font-medium">{senderEmail}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="p-6 space-y-4">
          {/* Current email */}
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={options.current}
              onChange={(e) => setOptions({ ...options, current: e.target.checked })}
              className="mt-1 mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {getActionVerb()} THIS email
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The email you're currently viewing will be {getActionDescription()}d
              </p>
            </div>
          </label>

          {/* Past emails */}
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={options.past}
              onChange={(e) => setOptions({ ...options, past: e.target.checked })}
              className="mt-1 mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {getActionVerb()} {affectedCount} PAST emails from this sender
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All past emails from {senderEmail} (last 30 days only)
              </p>
              
              {/* Preview toggle */}
              {emailPreviews.length > 0 && (
                <button
                  onClick={() => setShowPreviews(!showPreviews)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center"
                >
                  {showPreviews ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                  Show me these emails
                </button>
              )}
              
              {/* Email previews */}
              {showPreviews && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded p-3">
                  {emailPreviews.map((email) => (
                    <div key={email.id} className="text-xs space-y-1 pb-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <p className="font-medium text-gray-700 dark:text-gray-300">{email.subject}</p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {email.from} • {email.date}
                      </p>
                    </div>
                  ))}
                  {emailPreviews.length < affectedCount && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      Showing first {emailPreviews.length} of {affectedCount} emails...
                    </p>
                  )}
                </div>
              )}
            </div>
          </label>

          {/* Future emails */}
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={options.future}
              onChange={(e) => setOptions({ ...options, future: e.target.checked })}
              className="mt-1 mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                AUTO-{getActionVerb()} all FUTURE emails from this sender
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Creates a rule to automatically {getActionDescription()} future emails from {senderEmail}
              </p>
            </div>
          </label>

          {/* Warning for no selections */}
          {!options.current && !options.past && !options.future && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ⚠️ You've unchecked all boxes. Nothing will happen if you continue.
              </p>
            </div>
          )}

          {/* Confirmation for mass actions */}
          {affectedCount > 100 && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                This will affect {affectedCount} emails. Type "{getActionVerb()}" to confirm:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder={getActionVerb()}
                className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (affectedCount > 100 && confirmText !== getActionVerb())}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `Fuck It, ${getActionVerb()} Them`}
          </button>
        </div>
      </div>
    </div>
  )
}