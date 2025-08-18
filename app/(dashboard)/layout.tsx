'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const pathname = usePathname()
  const supabase = createClient()

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
    <div className="min-h-screen flex" style={{ backgroundColor: '#f1f5f9' }}>
      {/* Sidebar */}
      <div 
        className={`${isSidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 shadow-lg`}
        style={{ backgroundColor: 'white', borderRight: '1px solid #cad5e2' }}
      >
        <div className="p-4">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between mb-8">
            <Link 
              href="/dashboard" 
              className={`font-bold text-xl ${!isSidebarOpen && 'hidden'}`}
              style={{ color: '#0f172b' }}
            >
              Gmail Assistant
            </Link>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded hover:bg-gray-100"
              style={{ color: '#45556c' }}
            >
              {isSidebarOpen ? '←' : '→'}
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.href) 
                    ? 'font-semibold' 
                    : 'hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: isActive(item.href) ? '#f1f5f9' : 'transparent',
                  color: isActive(item.href) ? '#0f172b' : '#45556c',
                }}
              >
                <span className="text-xl">{item.icon}</span>
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
                  className="w-full px-3 py-2 text-sm rounded-lg hover:bg-gray-50 text-left"
                  style={{ color: '#45556c' }}
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