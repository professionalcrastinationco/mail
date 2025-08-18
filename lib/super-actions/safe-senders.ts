import { createClient } from '@/lib/supabase/client'

/**
 * Check if an email matches a pattern (supports wildcards)
 */
export function emailMatchesPattern(email: string, pattern: string): boolean {
  const normalizedEmail = email.toLowerCase()
  const normalizedPattern = pattern.toLowerCase()
  
  // Exact match
  if (normalizedEmail === normalizedPattern) {
    return true
  }
  
  // Domain wildcard: *@domain.com
  if (normalizedPattern.startsWith('*@')) {
    const domain = normalizedPattern.substring(2)
    return normalizedEmail.endsWith('@' + domain)
  }
  
  // Prefix wildcard: prefix@*
  if (normalizedPattern.endsWith('@*')) {
    const prefix = normalizedPattern.substring(0, normalizedPattern.length - 2)
    return normalizedEmail.startsWith(prefix + '@')
  }
  
  // No match
  return false
}

/**
 * Check if an email is in the user's safe senders list
 */
export async function isEmailSafe(userId: string, email: string): Promise<boolean> {
  const supabase = createClient()
  
  try {
    // Get all safe sender patterns for the user
    const { data: safeSenders, error } = await supabase
      .from('safe_senders')
      .select('email_address')
      .eq('user_id', userId)
    
    if (error) {
      console.error('Error checking safe senders:', error)
      return false  // Err on the side of caution
    }
    
    if (!safeSenders || safeSenders.length === 0) {
      return false
    }
    
    // Check if email matches any pattern
    return safeSenders.some(sender => 
      emailMatchesPattern(email, sender.email_address)
    )
  } catch (err) {
    console.error('Error in isEmailSafe:', err)
    return false
  }
}

/**
 * Filter out safe emails from a list
 */
export async function filterOutSafeEmails(
  userId: string, 
  emails: Array<{id: string, from: string}>
): Promise<Array<{id: string, from: string}>> {
  const supabase = createClient()
  
  try {
    // Get all safe sender patterns
    const { data: safeSenders, error } = await supabase
      .from('safe_senders')
      .select('email_address')
      .eq('user_id', userId)
    
    if (error || !safeSenders) {
      console.error('Error getting safe senders:', error)
      return emails  // Return all emails if we can't check
    }
    
    // Filter out emails that match any safe sender pattern
    return emails.filter(email => {
      const isSafe = safeSenders.some(sender => 
        emailMatchesPattern(email.from, sender.email_address)
      )
      return !isSafe  // Keep emails that are NOT safe (can be processed)
    })
  } catch (err) {
    console.error('Error filtering safe emails:', err)
    return emails
  }
}