'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastMessage {
  id: string
  type: ToastType
  title: string
  description?: string
}

// Global toast state management (singleton pattern)
class ToastManager {
  private listeners: Set<(messages: ToastMessage[]) => void> = new Set()
  private messages: ToastMessage[] = []

  subscribe(listener: (messages: ToastMessage[]) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.messages))
  }

  show(type: ToastType, title: string, description?: string) {
    const id = Math.random().toString(36).substr(2, 9)
    const message: ToastMessage = { id, type, title, description }
    this.messages = [...this.messages, message]
    this.notify()

    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.remove(id)
    }, 5000)
  }

  remove(id: string) {
    this.messages = this.messages.filter(m => m.id !== id)
    this.notify()
  }

  success(title: string, description?: string) {
    this.show('success', title, description)
  }

  error(title: string, description?: string) {
    this.show('error', title, description)
  }

  info(title: string, description?: string) {
    this.show('info', title, description)
  }

  warning(title: string, description?: string) {
    this.show('warning', title, description)
  }
}

export const toast = new ToastManager()

export function ToastContainer() {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  useEffect(() => {
    return toast.subscribe(setMessages)
  }, [])

  if (messages.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 space-y-2" style={{ zIndex: 9999 }}>
      {messages.map((message) => (
        <div
          key={message.id}
          className="bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out animate-slide-in-right"
          style={{
            animation: 'slideInRight 0.3s ease-out',
            minWidth: '320px',
            maxWidth: '420px',
          }}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {message.type === 'success' && (
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {message.type === 'error' && (
                  <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {message.type === 'warning' && (
                  <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                {message.type === 'info' && (
                  <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-gray-900">
                  {message.title}
                </p>
                {message.description && (
                  <p className="mt-1 text-sm text-gray-700">
                    {message.description}
                  </p>
                )}
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => toast.remove(message.id)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
