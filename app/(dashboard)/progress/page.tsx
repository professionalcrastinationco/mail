'use client'

import { useState, useEffect } from 'react'
import { features } from '@/lib/feature-progress'

export default function ProgressPage() {
  const [progress, setProgress] = useState(features)
  
  // Calculate completion percentages
  const calculatePhaseProgress = (phaseFeatures: typeof features.phase1) => {
    const total = Object.keys(phaseFeatures).length
    const completed = Object.values(phaseFeatures).filter(f => f.status === 'complete').length
    return Math.round((completed / total) * 100)
  }

  const phases = [
    { name: 'Phase 1: Foundation', features: progress.phase1, target: 'Launch Ready' },
    { name: 'Phase 2: Intelligence', features: progress.phase2, target: 'Q2 2025' },
    { name: 'Phase 3: AI Assistant', features: progress.phase3, target: 'Q3 2025' },
    { name: 'Phase 4: Financial', features: progress.phase4, target: 'Q3 2025' },
    { name: 'Phase 5: Analytics', features: progress.phase5, target: 'Q4 2025' }
  ]

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'complete': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800'
      case 'blocked': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'complete': return '✅'
      case 'in-progress': return '🔨'
      case 'blocked': return '🚫'
      default: return '⭕'
    }
  }

  const overallProgress = Math.round(
    (calculatePhaseProgress(progress.phase1) * 0.4 + // Phase 1 is 40% of MVP
     calculatePhaseProgress(progress.phase2) * 0.3 + // Phase 2 is 30% of MVP
     calculatePhaseProgress(progress.phase3) * 0.3)   // Phase 3 is 30% of MVP
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gmail Assistant - Build Progress
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex-1 bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <span className="text-lg font-semibold">{overallProgress}% MVP Complete</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(progress.phase1).filter(f => f.status === 'complete').length}
            </div>
            <div className="text-sm text-gray-600">Features Complete</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">
              {Object.values(progress.phase1).filter(f => f.status === 'in-progress').length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">
              {Object.values(progress.phase1).filter(f => f.status === 'blocked').length}
            </div>
            <div className="text-sm text-gray-600">Blocked</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-600">
              {Object.values(progress.phase1).filter(f => f.status === 'not-started').length}
            </div>
            <div className="text-sm text-gray-600">Not Started</div>
          </div>
        </div>

        {/* Phases */}
        {phases.map((phase, idx) => {
          const phaseProgress = calculatePhaseProgress(phase.features)
          const isCurrentPhase = idx === 0 || phases[idx - 1].features && 
            calculatePhaseProgress(phases[idx - 1].features) > 50
          
          return (
            <div key={phase.name} className={`mb-8 ${!isCurrentPhase && 'opacity-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{phase.name}</h2>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">{phase.target}</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${phaseProgress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{phaseProgress}%</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow">
                <div className="divide-y divide-gray-200">
                  {Object.entries(phase.features).map(([key, feature]) => (
                    <div key={key} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{getStatusIcon(feature.status)}</span>
                            <h3 className="font-medium text-gray-900">{feature.name}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(feature.status)}`}>
                              {feature.status.replace('-', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 ml-8">{feature.description}</p>
                          {feature.notes && (
                            <p className="text-xs text-amber-600 mt-1 ml-8">⚠️ {feature.notes}</p>
                          )}
                          {feature.completedDate && (
                            <p className="text-xs text-gray-500 mt-1 ml-8">
                              Completed: {feature.completedDate}
                            </p>
                          )}
                        </div>
                        {feature.effort && (
                          <div className="text-sm text-gray-500">
                            {feature.effort}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        )}

        {/* Next Steps */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">🎯 Next Steps</h3>
          <ol className="space-y-2 text-yellow-800">
            <li>1. Build Safe Senders management UI - <strong>30 mins</strong></li>
            <li>2. Create Super Actions dropdown in emails toolbar - <strong>2 hours</strong></li>
            <li>3. Wire up training mode warnings - <strong>1 hour</strong></li>
            <li>4. Test with real Gmail account - <strong>30 mins</strong></li>
          </ol>
          <p className="text-sm text-yellow-700 mt-4">
            Focus: Ship Phase 1 completely before touching Phase 2
          </p>
        </div>
      </div>
    </div>
  )
}