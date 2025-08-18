import { createClient } from '@/lib/supabase/client'

export type EmailAction = 'delete' | 'archive' | 'mark_read' | 'mark_unread' | 'apply_rule' | 'unsubscribe'
export type ActionType = 'manual' | 'automated'

interface EmailDetails {
  subject?: string
  from?: string
  to?: string
  snippet?: string
  ruleName?: string
  [key: string]: any
}

interface HistoryEntry {
  email_id: string
  thread_id?: string
  action: EmailAction
  action_type: ActionType
  details?: EmailDetails
}

class EmailHistoryService {
  private supabase = createClient()

  async trackAction(entry: HistoryEntry) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        console.error('No user found for history tracking')
        return
      }

      const { error } = await this.supabase
        .from('email_history')
        .insert({
          user_id: user.id,
          email_id: entry.email_id,
          thread_id: entry.thread_id,
          action: entry.action,
          action_type: entry.action_type,
          details: entry.details || {}
        })

      if (error) {
        console.error('Error tracking email action:', error)
      }
    } catch (err) {
      console.error('Failed to track email action:', err)
    }
  }

  async trackBulkActions(entries: HistoryEntry[]) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        console.error('No user found for history tracking')
        return
      }

      const records = entries.map(entry => ({
        user_id: user.id,
        email_id: entry.email_id,
        thread_id: entry.thread_id,
        action: entry.action,
        action_type: entry.action_type,
        details: entry.details || {}
      }))

      const { error } = await this.supabase
        .from('email_history')
        .insert(records)

      if (error) {
        console.error('Error tracking bulk email actions:', error)
      }
    } catch (err) {
      console.error('Failed to track bulk email actions:', err)
    }
  }

  async getHistory(limit: number = 100) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        console.error('No user found for history fetch')
        return []
      }

      const { data, error } = await this.supabase
        .from('email_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching email history:', error)
        return []
      }

      return data || []
    } catch (err) {
      console.error('Failed to fetch email history:', err)
      return []
    }
  }

  async cleanupOldHistory() {
    try {
      const { error } = await this.supabase
        .rpc('cleanup_old_email_history')

      if (error) {
        console.error('Error cleaning up old history:', error)
      }
    } catch (err) {
      console.error('Failed to cleanup old history:', err)
    }
  }
}

export const emailHistory = new EmailHistoryService()