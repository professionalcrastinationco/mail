'use client'

import { useState, useEffect } from 'react'

interface LastChancePopupProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  actionType: string
  affectedCount: number
  actionDescription: string
  sendersList?: string[]
  selectedCount?: number
}

export default function LastChancePopup({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  affectedCount,
  actionDescription,
  sendersList,
  selectedCount
}: LastChancePopupProps) {
  const [confirmText, setConfirmText] = useState('')
  const [understood, setUnderstood] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setConfirmText('')
      setUnderstood(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const requiresTypedConfirmation = affectedCount > 50
  const confirmWord = actionType.includes('delete') ? 'DELETE' : 'CONFIRM'

  const handleConfirm = () => {
    if (requiresTypedConfirmation && confirmText !== confirmWord) {
      alert(`Type "${confirmWord}" to confirm this action`)
      return
    }
    if (!understood) {
      alert('Please check the box to confirm you understand')
      return
    }
    onConfirm()
  }

  const getWarningLevel = () => {
    if (affectedCount > 500) return { color: 'red', emoji: '🚨', text: 'EXTREME' }
    if (affectedCount > 100) return { color: 'orange', emoji: '⚠️', text: 'HIGH' }
    if (affectedCount > 20) return { color: 'yellow', emoji: '⚡', text: 'MODERATE' }
    return { color: 'blue', emoji: '💡', text: 'LOW' }
  }

  const warning = getWarningLevel()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-6 border-b border-gray-200 bg-gradient-to-r ${
          warning.color === 'red' ? 'from-red-500 to-red-600' :
          warning.color === 'orange' ? 'from-orange-500 to-orange-600' :
          warning.color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
          'from-blue-500 to-blue-600'
        }`}>
          <div className="text-white">
            <div className="flex items-center space-x-2">
              <span className="text-3xl">{warning.emoji}</span>
              <h2 className="text-2xl font-bold">Hold Up!</h2>
            </div>
            <p className="mt-2 text-lg font-medium">
              {warning.text} IMPACT ACTION
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              You're about to:
            </h3>
            <p className="text-gray-700">{actionDescription}</p>
            
            {sendersList && sendersList.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Affected sender{sendersList.length > 1 ? 's' : ''}:
                </p>
                <div className="space-y-1">
                  {sendersList.slice(0, 5).map((sender, idx) => (
                    <div key={idx} className="text-sm text-gray-600 pl-2">
                      • {sender}
                    </div>
                  ))}
                  {sendersList.length > 5 && (
                    <div className="text-sm text-gray-500 pl-2 italic">
                      ... and {sendersList.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={`rounded-lg p-4 ${
            warning.color === 'red' ? 'bg-red-50 border-2 border-red-200' :
            warning.color === 'orange' ? 'bg-orange-50 border-2 border-orange-200' :
            warning.color === 'yellow' ? 'bg-yellow-50 border-2 border-yellow-200' :
            'bg-blue-50 border-2 border-blue-200'
          }`}>
            <div className="flex items-center space-x-3">
              <span className="text-4xl font-bold">{affectedCount}</span>
              <div>
                <p className="font-semibold text-gray-900">Emails will be affected</p>
                <p className="text-sm text-gray-600">This action cannot be undone easily</p>
              </div>
            </div>
          </div>

          {/* Safety features reminder */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">✅ Protected emails:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Your safe senders list is protected</li>
              <li>• Starred emails won't be affected</li>
              <li>• Important/Priority emails are skipped</li>
            </ul>
          </div>

          {/* Understanding checkbox */}
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="mt-1 mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                I understand this will affect {affectedCount} emails
              </p>
              <p className="text-sm text-gray-600">
                I've reviewed the action and I'm ready to proceed
              </p>
            </div>
          </label>

          {/* Confirmation for large actions */}
          {requiresTypedConfirmation && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-700 mb-2 font-semibold">
                ⚠️ This is a large operation affecting {affectedCount} emails
              </p>
              <p className="text-sm text-red-700 mb-2">
                Type "{confirmWord}" to confirm:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder={confirmWord}
                className="w-full px-3 py-2 border border-red-300 rounded focus:ring-red-500 focus:border-red-500"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!understood || (requiresTypedConfirmation && confirmText !== confirmWord)}
            className={`px-6 py-2 text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed ${
              warning.color === 'red' ? 'bg-red-600 hover:bg-red-700' :
              warning.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
              warning.color === 'yellow' ? 'bg-yellow-600 hover:bg-yellow-700' :
              'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Yes, Execute Action
          </button>
        </div>
      </div>
    </div>
  )
}