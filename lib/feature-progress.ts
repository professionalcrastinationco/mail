// Feature Progress Tracking

type FeatureStatus = 'complete' | 'in-progress' | 'blocked' | 'not-started'

interface Feature {
  name: string
  description: string
  status: FeatureStatus
  effort?: string
  notes?: string
  completedDate?: string
}

interface FeatureSet {
  [key: string]: Feature
}

export const features = {
  phase1: {
    gmailAuth: {
      name: 'Gmail OAuth Integration',
      description: 'Google OAuth login and token management',
      status: 'complete',
      completedDate: '2025-08-16',
      effort: '2 days'
    },
    emailFetching: {
      name: 'Email Fetching',
      description: 'Fetch and display emails from Gmail API',
      status: 'complete',
      completedDate: '2025-08-16',
      effort: '1 day'
    },
    manualDelete: {
      name: 'Manual Delete',
      description: 'Delete individual/selected emails',
      status: 'complete',
      completedDate: '2025-08-17',
      effort: '2 hours'
    },
    markAsRead: {
      name: 'Mark as Read',
      description: 'Mark selected emails as read',
      status: 'complete',
      completedDate: '2025-08-17',
      effort: '1 hour'
    },
    historyTracking: {
      name: 'History Tracking',
      description: 'Track all email actions in database',
      status: 'complete',
      completedDate: '2025-08-17',
      effort: '3 hours'
    },
    historyUI: {
      name: 'History UI',
      description: 'View history of all actions taken',
      status: 'complete',
      completedDate: '2025-08-17',
      effort: '2 hours'
    },
    databaseSchema: {
      name: 'Super Actions Database',
      description: 'Database tables for rules, safe senders, etc',
      status: 'complete',
      completedDate: '2025-08-17',
      effort: '2 hours'
    },
    safeSendersBackend: {
      name: 'Safe Senders Backend',
      description: 'Database and validation for safe senders',
      status: 'complete',
      completedDate: '2025-08-17',
      effort: '1 hour'
    },
    safeSendersUI: {
      name: 'Safe Senders Management UI',
      description: 'Page to add/remove/view safe senders',
      status: 'complete',
      completedDate: '2025-08-18',
      effort: '30 mins'
    },
    superActionsDropdown: {
      name: 'Super Actions Dropdown',
      description: 'Dropdown menu with delete/archive actions',
      status: 'complete',
      completedDate: '2025-08-18',
      effort: '2 hours'
    },
    trainingMode: {
      name: 'Training Mode Warnings',
      description: 'Warnings and confirmations for destructive actions',
      status: 'complete',
      completedDate: '2025-08-18',
      effort: '1 hour'
    },
    progressiveUnlock: {
      name: 'Progressive Unlock System',
      description: '30/90 day limits with gradual unlock',
      status: 'not-started',
      effort: '2 hours'
    },
    rateLimiting: {
      name: 'Rate Limiting',
      description: 'Prevent Gmail API rate limit issues',
      status: 'not-started',
      effort: '1 hour',
      notes: 'rate-limiter.ts exists but not implemented'
    },
    batchProcessing: {
      name: 'Batch Processing Queue',
      description: 'Process large email operations in background',
      status: 'not-started',
      effort: '3 hours'
    }
  } as FeatureSet,
  
  phase2: {
    rulesUI: {
      name: 'Rules Management UI',
      description: 'Create/edit/delete email rules',
      status: 'not-started',
      effort: '1 day'
    },
    ruleMatching: {
      name: 'Rule Matching Engine',
      description: 'Apply rules to incoming emails',
      status: 'not-started',
      effort: '2 days'
    },
    aiClassification: {
      name: 'AI Email Classification',
      description: 'Use AI to categorize emails',
      status: 'not-started',
      effort: '3 days'
    },
    undoSystem: {
      name: 'Undo System (29 days)',
      description: 'Undo any action within 29 days',
      status: 'not-started',
      effort: '1 day'
    },
    smartFilters: {
      name: 'Smart Filters',
      description: 'Advanced email filtering options',
      status: 'not-started',
      effort: '2 days'
    }
  } as FeatureSet,
  
  phase3: {
    aiReplyGen: {
      name: 'AI Reply Generation',
      description: 'Generate email replies with AI',
      status: 'not-started',
      effort: '3 days'
    },
    toneSettings: {
      name: 'Tone/Personality Settings',
      description: 'Customize AI tone per sender',
      status: 'not-started',
      effort: '2 days'
    },
    draftManagement: {
      name: 'Draft Management',
      description: 'Save and manage AI drafts',
      status: 'not-started',
      effort: '2 days'
    },
    replyUI: {
      name: 'Reply Interface',
      description: 'UI for reviewing and sending replies',
      status: 'not-started',
      effort: '2 days'
    }
  } as FeatureSet,
  
  phase4: {
    chargeDetection: {
      name: 'Recurring Charge Detection',
      description: 'Find subscriptions in emails',
      status: 'not-started',
      effort: '3 days'
    },
    paymentReminders: {
      name: 'Payment Reminders',
      description: 'Alert for due/missed payments',
      status: 'not-started',
      effort: '1 day'
    },
    spendingSummary: {
      name: 'Spending Summary',
      description: 'Visualize spending patterns',
      status: 'not-started',
      effort: '2 days'
    }
  } as FeatureSet,
  
  phase5: {
    timeSaved: {
      name: 'Time Saved Calculator',
      description: 'Estimate time saved by automation',
      status: 'not-started',
      effort: '1 day'
    },
    actionStats: {
      name: 'Action Statistics',
      description: 'Dashboard of all actions taken',
      status: 'not-started',
      effort: '1 day'
    },
    usagePatterns: {
      name: 'Usage Patterns',
      description: 'Insights into email habits',
      status: 'not-started',
      effort: '2 days'
    },
    dashboardUI: {
      name: 'Analytics Dashboard',
      description: 'Beautiful dashboard with all metrics',
      status: 'not-started',
      effort: '3 days'
    }
  } as FeatureSet
}

// Helper to update feature status (you'll call this as you complete features)
export function updateFeatureStatus(
  phase: keyof typeof features,
  featureKey: string,
  status: FeatureStatus,
  notes?: string
) {
  if (features[phase] && features[phase][featureKey]) {
    features[phase][featureKey].status = status
    if (notes) features[phase][featureKey].notes = notes
    if (status === 'complete') {
      features[phase][featureKey].completedDate = new Date().toISOString().split('T')[0]
    }
  }
}