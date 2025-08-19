'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/emails', label: 'Inbox', icon: '📧' },
    { href: '/rules', label: 'Rules', icon: '⚙️' },
    { href: '/history', label: 'History', icon: '📜' },
  ]

  const isActive = (href: string) => {
    return pathname === href
  }

  return (
    <div className="flex bg-gray-50">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-white border-r border-gray-200 min-h-screen`}>
        <div className="p-4">
          {/* Toggle button */}
          <div className="flex justify-end mb-8">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isSidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                )}
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive(item.href) 
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                {isSidebarOpen && (
                  <span className="ml-3">{item.label}</span>
                )}
              </Link>
            ))}
          </nav>

          {/* Bottom section - Sign out */}
          <div className="absolute bottom-4 left-4 right-4">
            {isSidebarOpen && (
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="w-full px-3 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-left transition-colors"
                >
                  Sign Out
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}