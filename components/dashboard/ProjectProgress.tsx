'use client'

import { useState } from 'react'

interface FeatureItem {
  name: string
  status: 'complete' | 'partial' | 'not-started' | 'broken'
  description?: string
  progress?: number
}

interface Phase {
  name: string
  overallProgress: number
  status: 'complete' | 'in-progress' | 'not-started'
  features: FeatureItem[]
}

export default function ProjectProgress() {
  const [expandedPhase, setExpandedPhase] = useState<string | null>('Phase 1')

  const phases: Phase[] = [
    {
      name: 'Phase 1',
      overallProgress: 85,
      status: 'in-progress',
      features: [
        // Core Infrastructure
        { name: 'Next.js + Vercel + Supabase stack', status: 'complete', description: 'Fully configured and deployed' },
        { name: 'Google OAuth login', status: 'complete', description: 'Users can sign in with Gmail accounts' },
        { name: 'Gmail API integration', status: 'complete', description: 'Successfully fetching and managing emails' },
        { name: 'Database schema', status: 'complete', description: 'All tables created and configured' },
        { name: 'GitHub repository', status: 'complete', description: 'Set up at github.com/agardiner7018/mail-relief-app' },
        
        // Email Management
        { name: 'Email fetching', status: 'complete', description: 'Retrieves emails from Gmail with pagination' },
        { name: 'Manual Delete', status: 'complete', description: 'Delete emails with proper UI feedback' },
        { name: 'Manual Archive', status: 'complete', description: 'Archive emails - NOW WORKING! ✅' },
        { name: 'Mark as Read', status: 'complete', description: 'Mark emails as read/unread' },
        { name: 'History tracking', status: 'complete', description: 'Every action is logged with timestamps' },
        
        // Super Actions
        { name: 'Super Actions Backend', status: 'complete', description: 'API routes execute bulk operations' },
        { name: 'Safe Senders List', status: 'complete', description: 'Backend working, UI at /safe-senders' },
        { name: 'Super Actions UI', status: 'complete', description: '6 action types with dropdown' },
        { name: 'Access Control', status: 'complete', description: 'Requires 3+ safe senders to unlock' },
        { name: 'Warning System', status: 'complete', description: 'LastChancePopup with clear messaging' },
        { name: 'Delete by Sender', status: 'complete', description: 'Delete all from specific senders' },
        { name: 'Archive by Sender', status: 'complete', description: 'Archive all from specific senders' },
        { name: 'Delete Old Emails', status: 'complete', description: '30/90 day deletion working' },
        { name: 'Archive Old Emails', status: 'complete', description: '30 day archiving working' },
        
        // UI/UX
        { name: 'Responsive layout', status: 'complete', description: 'Working sidebar navigation' },
        { name: 'Dark mode support', status: 'complete', description: 'Theme switching implemented' },
        { name: 'Toast Notifications', status: 'complete', description: 'Beautiful custom notifications - JUST ADDED! 🎉' },
        { name: 'Marketing pages', status: 'complete', description: 'Home, Features, FAQ, Pricing, Contact' },
        { name: 'Logo and branding', status: 'complete', description: 'Custom branding in place' },
        
        // Remaining Phase 1 Items
        { name: 'Progressive Unlock System', status: 'not-started', description: '30/90/unlimited day progression - NOT BUILT', progress: 0 },
        { name: 'Rate Limiting', status: 'not-started', description: 'Gmail API throttling protection - MISSING', progress: 0 },
        { name: 'Batch Processing Queue', status: 'not-started', description: 'Background jobs for large operations - NOT IMPLEMENTED', progress: 0 },
        { name: 'Unsubscribe Action', status: 'partial', description: 'UI exists but unsubscribe logic not implemented', progress: 50 },
      ]
    },
    {
      name: 'Phase 2',
      overallProgress: 0,
      status: 'not-started',
      features: [
        { name: 'AI Email Classification', status: 'not-started', description: 'Smart categorization of emails' },
        { name: 'Rules Engine', status: 'not-started', description: 'Automatic rules from Super Actions' },
        { name: 'Undo System', status: 'not-started', description: '30-day undo window for actions' },
        { name: 'Smart Filters', status: 'not-started', description: 'AI-powered email filtering' },
        { name: 'Bulk Unsubscribe', status: 'not-started', description: 'Detect and click unsubscribe links' },
      ]
    },
    {
      name: 'Phase 3',
      overallProgress: 0,
      status: 'not-started',
      features: [
        { name: 'AI Reply Generation', status: 'not-started', description: 'Auto-generate email replies' },
        { name: 'Tone Settings', status: 'not-started', description: 'Customize AI tone per sender' },
        { name: 'Smart Compose', status: 'not-started', description: 'AI-assisted email writing' },
        { name: 'Response Templates', status: 'not-started', description: 'Save and reuse AI templates' },
      ]
    },
    {
      name: 'Phase 4',
      overallProgress: 0,
      status: 'not-started',
      features: [
        { name: 'Financial Tracking', status: 'not-started', description: 'Track recurring charges' },
        { name: 'Payment Reminders', status: 'not-started', description: 'Alert for due/missed payments' },
        { name: 'Spending Summary', status: 'not-started', description: 'Analyze spending patterns' },
        { name: 'Subscription Management', status: 'not-started', description: 'Track and manage subscriptions' },
      ]
    },
    {
      name: 'Phase 5',
      overallProgress: 0,
      status: 'not-started',
      features: [
        { name: 'Analytics Dashboard', status: 'not-started', description: 'Detailed email statistics' },
        { name: 'Time Saved Calculator', status: 'not-started', description: 'Show productivity gains' },
        { name: 'Email Insights', status: 'not-started', description: 'Patterns and recommendations' },
        { name: 'Performance Metrics', status: 'not-started', description: 'Track app effectiveness' },
      ]
    }
  ]

  const getStatusIcon = (status: FeatureItem['status']) => {
    switch (status) {
      case 'complete':
        return <span className="text-green-500">✅</span>
      case 'partial':
        return <span className="text-yellow-500">⏱️</span>
      case 'broken':
        return <span className="text-red-500">🔧</span>
      default:
        return <span className="text-gray-400">❌</span>
    }
  }

  const getPhaseColor = (phase: Phase) => {
    if (phase.status === 'complete') return 'from-green-500 to-green-600'
    if (phase.status === 'in-progress') return 'from-blue-500 to-blue-600'
    return 'from-gray-400 to-gray-500'
  }

  const getProgressBarColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 50) return 'bg-blue-500'
    if (progress >= 20) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const calculateStats = () => {
    let totalFeatures = 0
    let completedFeatures = 0
    let partialFeatures = 0
    let notStartedFeatures = 0

    phases.forEach(phase => {
      phase.features.forEach(feature => {
        totalFeatures++
        if (feature.status === 'complete') completedFeatures++
        else if (feature.status === 'partial') partialFeatures++
        else if (feature.status === 'not-started') notStartedFeatures++
      })
    })

    return {
      total: totalFeatures,
      completed: completedFeatures,
      partial: partialFeatures,
      notStarted: notStartedFeatures,
      overallProgress: Math.round((completedFeatures / totalFeatures) * 100)
    }
  }

  const stats = calculateStats()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gmail Assistant Development Progress</h1>
        <p className="text-gray-700">Real-time status of features and development phases</p>
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-medium text-yellow-800">
            📅 Last Updated: August 19, 2025 | 🚀 Version: 0.0.2 | 💻 Active Development
          </p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Overall Progress</h3>
            <span className="text-2xl font-bold text-blue-600">{stats.overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getProgressBarColor(stats.overallProgress)}`}
              style={{ width: `${stats.overallProgress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <span className="text-3xl opacity-20">✅</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.partial}</p>
            </div>
            <span className="text-3xl opacity-20">⏱️</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Not Started</p>
              <p className="text-2xl font-bold text-gray-600">{stats.notStarted}</p>
            </div>
            <span className="text-3xl opacity-20">❌</span>
          </div>
        </div>
      </div>

      {/* Recent Updates */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8 border border-green-200">
        <h2 className="text-lg font-bold text-gray-900 mb-3">🎉 Recent Fixes & Updates (Today)</h2>
        <ul className="space-y-2 text-sm text-gray-800">
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✅</span>
            <span><strong>Archive Button Fixed:</strong> Regular archive action now works properly with onClick handler</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✅</span>
            <span><strong>Super Actions Archive Fixed:</strong> Archived emails now properly disappear from inbox (only fetching INBOX label)</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✅</span>
            <span><strong>Toast Notifications Added:</strong> Beautiful custom notifications replace ugly browser alerts</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✅</span>
            <span><strong>Super Actions Messaging Clarified:</strong> Clear indication of selected vs total affected emails</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✅</span>
            <span><strong>Token Management Fixed:</strong> Server-side Gmail token handling now works properly</span>
          </li>
        </ul>
      </div>

      {/* Phases */}
      <div className="space-y-4">
        {phases.map((phase) => (
          <div key={phase.name} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => setExpandedPhase(expandedPhase === phase.name ? null : phase.name)}
              className={`w-full px-6 py-4 bg-gradient-to-r ${getPhaseColor(phase)} text-white flex items-center justify-between hover:opacity-95 transition-opacity`}
            >
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-bold">{phase.name}</h2>
                <span className="text-sm bg-white bg-opacity-30 px-3 py-1 rounded-full font-medium">
                  {phase.status === 'complete' ? 'Complete' : 
                   phase.status === 'in-progress' ? 'In Progress' : 'Not Started'}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-2xl font-bold">{phase.overallProgress}%</p>
                  <p className="text-xs opacity-90">
                    {phase.features.filter(f => f.status === 'complete').length}/{phase.features.length} features
                  </p>
                </div>
                <svg 
                  className={`w-6 h-6 transition-transform ${expandedPhase === phase.name ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {expandedPhase === phase.name && (
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-700 mb-2">
                    <span>Progress</span>
                    <span>{phase.features.filter(f => f.status === 'complete').length} of {phase.features.length} complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${getProgressBarColor(phase.overallProgress)}`}
                      style={{ width: `${phase.overallProgress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {phase.features.map((feature, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-start p-3 rounded-lg border ${
                        feature.status === 'complete' ? 'bg-green-50 border-green-200' :
                        feature.status === 'partial' ? 'bg-yellow-50 border-yellow-200' :
                        feature.status === 'broken' ? 'bg-red-50 border-red-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="mr-3 mt-0.5">{getStatusIcon(feature.status)}</div>
                      <div className="flex-1">
                        <h3 className={`font-medium ${
                          feature.status === 'complete' ? 'text-green-900' :
                          feature.status === 'partial' ? 'text-yellow-900' :
                          feature.status === 'broken' ? 'text-red-900' :
                          'text-gray-900'
                        }`}>
                          {feature.name}
                        </h3>
                        {feature.description && (
                          <p className="text-sm text-gray-700 mt-1">{feature.description}</p>
                        )}
                        {feature.progress !== undefined && feature.progress < 100 && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="h-1.5 rounded-full bg-yellow-500"
                                style={{ width: `${feature.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Critical Items */}
      <div className="mt-8 bg-red-50 border-2 border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-red-900 mb-3">🔴 Critical Items to Fix (Phase 1)</h2>
        <ul className="space-y-2 text-sm text-red-800">
          <li className="flex items-start">
            <span className="mr-2">1.</span>
            <div>
              <strong>Rate Limiting:</strong> App will hit Gmail API limits and crash with bulk operations. 
              Need to implement 75% threshold monitoring and queue system.
            </div>
          </li>
          <li className="flex items-start">
            <span className="mr-2">2.</span>
            <div>
              <strong>Progressive Unlock System:</strong> 30/90/unlimited day limits not implemented. 
              Users can delete everything immediately which is dangerous.
            </div>
          </li>
          <li className="flex items-start">
            <span className="mr-2">3.</span>
            <div>
              <strong>Batch Processing Queue:</strong> No background job system for large operations. 
              Everything runs synchronously which will timeout on large inboxes.
            </div>
          </li>
        </ul>
      </div>

      {/* Next Steps */}
      <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-blue-900 mb-3">📋 Recommended Next Steps</h2>
        <ol className="space-y-2 text-sm text-blue-800">
          <li>1. Add rate limiting to prevent Gmail API crashes</li>
          <li>2. Implement progressive unlock system for safety</li>
          <li>3. Build batch processing queue for large operations</li>
          <li>4. Test with real Gmail accounts with 1000+ emails</li>
          <li>5. Ship Phase 1 MVP and get first 10 beta users</li>
        </ol>
      </div>
    </div>
  )
}
