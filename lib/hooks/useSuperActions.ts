'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SuperActionStatus {
  canUse: boolean
  safeSendersCount: number
  requiredCount: number
  isLoading: boolean
  trainingModeActive: boolean
  daysLimit: number
  successfulActionsCount: number
}

export function useSuperActions() {
  const [status, setStatus] = useState<SuperActionStatus>({
    canUse: false,
    safeSendersCount: 0,
    requiredCount: 3,
    isLoading: true,
    trainingModeActive: true,
    daysLimit: 30,
    successfulActionsCount: 0
  })
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkSuperActionStatus()
  }, [])

  const checkSuperActionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check user settings
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!settings) {
        // Create default settings
        await supabase
          .from('user_settings')
          .insert([{
            user_id: user.id,
            safe_senders_required: true,
            safe_senders_count: 0,
            training_mode_active: true,
            successful_actions_count: 0,
            days_limit: 30
          }])

        setStatus({
          canUse: false,
          safeSendersCount: 0,
          requiredCount: 3,
          isLoading: false,
          trainingModeActive: true,
          daysLimit: 30,
          successfulActionsCount: 0
        })
      } else {
        const canUse = !settings.safe_senders_required || settings.safe_senders_count >= 3
        
        setStatus({
          canUse,
          safeSendersCount: settings.safe_senders_count,
          requiredCount: 3,
          isLoading: false,
          trainingModeActive: settings.training_mode_active,
          daysLimit: settings.days_limit,
          successfulActionsCount: settings.successful_actions_count
        })
      }
    } catch (err) {
      console.error('Error checking super action status:', err)
      setStatus(prev => ({ ...prev, isLoading: false }))
    }
  }

  const redirectToSafeSetup = () => {
    router.push('/rules/safe-senders?from=super-action')
  }

  const checkTrainingLimits = (emailCount: number): boolean => {
    if (!status.trainingModeActive) return true
    
    const now = new Date()
    const limitDate = new Date()
    limitDate.setDate(limitDate.getDate() - status.daysLimit)
    
    // For now, we'll just return true and handle the date filtering elsewhere
    // This would normally check if the emails are within the allowed date range
    return true
  }

  const incrementSuccessCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newCount = status.successfulActionsCount + 1
      
      // Update in database
      await supabase
        .from('user_settings')
        .update({ 
          successful_actions_count: newCount,
          // Auto-unlock based on success count
          days_limit: newCount >= 10 ? null : newCount >= 5 ? 90 : 30
        })
        .eq('user_id', user.id)

      // Update local state
      setStatus(prev => ({
        ...prev,
        successfulActionsCount: newCount,
        daysLimit: newCount >= 10 ? 0 : newCount >= 5 ? 90 : 30
      }))
    } catch (err) {
      console.error('Error updating success count:', err)
    }
  }

  return {
    ...status,
    redirectToSafeSetup,
    checkTrainingLimits,
    incrementSuccessCount,
    refresh: checkSuperActionStatus
  }
}