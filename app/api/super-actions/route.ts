// app/api/super-actions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Super Actions API: Starting request')
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('Super Actions API: User not authenticated')
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    console.log('Super Actions API: User authenticated:', user.id)

    const body = await request.json()
    const { action, selectedEmailIds, days, allEmails } = body
    
    console.log('Super Actions API: Action requested:', action)
    console.log('Super Actions API: Selected emails count:', selectedEmailIds?.length)
    console.log('Super Actions API: All emails count:', allEmails?.length)

    // Check if user has enough safe senders
    const { data: safeSenders, error: safeSendersError } = await supabase
      .from('safe_senders')
      .select('email_address')
      .eq('user_id', user.id)

    if (safeSendersError) {
      console.error('Super Actions API: Error fetching safe senders:', safeSendersError)
      return NextResponse.json({ 
        success: false, 
        error: `Database error: ${safeSendersError.message}` 
      }, { status: 500 })
    }

    if (!safeSenders || safeSenders.length < 3) {
      console.log('Super Actions API: Not enough safe senders:', safeSenders?.length)
      return NextResponse.json({ 
        success: false, 
        error: 'You need at least 3 safe senders to use Super Actions' 
      }, { status: 403 })
    }

    console.log('Super Actions API: Safe senders count:', safeSenders.length)

    // Get Gmail access token directly from database (server-side approach)
    let accessToken: string | null = null
    
    // First, try to get the token from the database
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('gmail_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenRecord) {
      console.error('Super Actions API: No stored Gmail tokens found:', tokenError)
      
      // Try to get from the session as a fallback
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.provider_token) {
        console.log('Super Actions API: Using session provider token')
        accessToken = session.provider_token
        
        // Store it for future use
        const expiresAt = new Date(Date.now() + 3600 * 1000) // 1 hour from now
        await supabase
          .from('gmail_tokens')
          .upsert({
            user_id: user.id,
            access_token: session.provider_token,
            refresh_token: session.provider_refresh_token,
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
      } else {
        console.error('Super Actions API: No Gmail tokens available')
        return NextResponse.json({ 
          success: false, 
          error: 'Gmail authentication required - please reconnect your Gmail account' 
        }, { status: 401 })
      }
    } else {
      // Check if token is expired
      const expiresAt = new Date(tokenRecord.expires_at).getTime()
      const now = Date.now()
      
      if (expiresAt > now + 60000) {
        // Token is still valid
        console.log('Super Actions API: Using valid token from database')
        accessToken = tokenRecord.access_token
      } else {
        // Token expired, need to refresh
        console.log('Super Actions API: Token expired, attempting to refresh')
        
        if (!tokenRecord.refresh_token) {
          console.error('Super Actions API: No refresh token available')
          return NextResponse.json({ 
            success: false, 
            error: 'Gmail session expired - please reconnect your Gmail account' 
          }, { status: 401 })
        }
        
        // Refresh the token using Google OAuth2 endpoint
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET
        
        if (!clientId || !clientSecret) {
          console.error('Super Actions API: Missing Google OAuth credentials')
          return NextResponse.json({ 
            success: false, 
            error: 'Server configuration error' 
          }, { status: 500 })
        }
        
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: tokenRecord.refresh_token,
            grant_type: 'refresh_token',
          }),
        })
        
        if (!refreshResponse.ok) {
          const errorText = await refreshResponse.text()
          console.error('Super Actions API: Failed to refresh token:', errorText)
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to refresh Gmail access - please reconnect your Gmail account' 
          }, { status: 401 })
        }
        
        const refreshData = await refreshResponse.json()
        accessToken = refreshData.access_token
        
        // Update the stored token
        const newExpiresAt = new Date(Date.now() + (refreshData.expires_in || 3600) * 1000)
        await supabase
          .from('gmail_tokens')
          .update({
            access_token: refreshData.access_token,
            expires_at: newExpiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
        
        console.log('Super Actions API: Token refreshed successfully')
      }
    }

    if (!accessToken) {
      console.error('Super Actions API: Failed to obtain Gmail access token')
      return NextResponse.json({ 
        success: false, 
        error: 'Gmail authentication failed' 
      }, { status: 401 })
    }

    console.log('Super Actions API: Gmail token obtained')

    // Build list of protected email addresses
    const protectedEmails = new Set(safeSenders.map(s => s.email_address.toLowerCase()))

    // Determine which emails to process based on action
    let emailsToProcess: string[] = []
    let actionDescription = ''

    switch (action) {
      case 'delete_by_sender':
      case 'archive_by_sender': {
        // Get unique senders from selected emails
        const selectedEmailDetails = allEmails.filter((e: any) => selectedEmailIds.includes(e.id))
        const uniqueSenders = new Set(selectedEmailDetails.map((e: any) => e.from.toLowerCase()))
        
        // Filter out protected senders
        const sendersToProcess = Array.from(uniqueSenders).filter(sender => {
          // Extract email from "Name <email@domain.com>" format
          const emailMatch = sender.match(/<(.+)>/)
          const email = emailMatch ? emailMatch[1] : sender
          return !protectedEmails.has(email.toLowerCase())
        })

        // Find all emails from these senders
        emailsToProcess = allEmails
          .filter((e: any) => {
            const senderLower = e.from.toLowerCase()
            return sendersToProcess.some(sender => senderLower.includes(sender))
          })
          .map((e: any) => e.id)

        actionDescription = `${action.replace('_', ' ')} from ${sendersToProcess.length} sender(s)`
        break
      }

      case 'delete_old':
      case 'archive_old': {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)
        
        // Filter emails older than cutoff, excluding protected senders
        emailsToProcess = allEmails
          .filter((e: any) => {
            const emailDate = new Date(e.date)
            const senderEmail = e.from.toLowerCase()
            const emailMatch = senderEmail.match(/<(.+)>/)
            const email = emailMatch ? emailMatch[1] : senderEmail
            
            return emailDate < cutoffDate && !protectedEmails.has(email.toLowerCase())
          })
          .map((e: any) => e.id)

        actionDescription = `${action.replace('_', ' ')} than ${days} days`
        break
      }

      case 'unsubscribe_and_delete': {
        // For now, just delete - unsubscribe logic would go here
        const selectedEmailDetails = allEmails.filter((e: any) => selectedEmailIds.includes(e.id))
        const uniqueSenders = new Set(selectedEmailDetails.map((e: any) => e.from.toLowerCase()))
        
        emailsToProcess = allEmails
          .filter((e: any) => {
            const senderLower = e.from.toLowerCase()
            const emailMatch = senderLower.match(/<(.+)>/)
            const email = emailMatch ? emailMatch[1] : senderLower
            
            return Array.from(uniqueSenders).some(sender => senderLower.includes(sender)) 
              && !protectedEmails.has(email.toLowerCase())
          })
          .map((e: any) => e.id)

        actionDescription = 'unsubscribe and delete'
        break
      }

      default:
        console.error('Super Actions API: Invalid action type:', action)
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action type' 
        }, { status: 400 })
    }

    console.log('Super Actions API: Emails to process:', emailsToProcess.length)

    // If no emails to process, return early
    if (emailsToProcess.length === 0) {
      console.log('Super Actions API: No emails to process (all might be protected)')
      return NextResponse.json({
        success: true,
        processedCount: 0,
        failedCount: 0,
        message: 'No emails to process (all senders might be in your safe list)'
      })
    }

    // Process emails in batches
    const batchSize = 10
    let processedCount = 0
    let failedCount = 0
    const isArchive = action.includes('archive')

    // Record the action in history
    console.log('Super Actions API: Recording action in history')
    const { data: actionHistory, error: historyError } = await supabase
      .from('action_history')
      .insert({
        user_id: user.id,
        action_type: action.includes('delete') ? 'super_delete' : 'super_archive',
        affected_emails: emailsToProcess,
        affected_count: emailsToProcess.length,
        status: 'processing',
        can_undo_until: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()

    if (historyError) {
      console.error('Super Actions API: Error inserting into action_history:', historyError)
      console.error('Super Actions API: This usually means the action_history table does not exist')
      console.error('Super Actions API: Run the migration: 002_super_actions_foundation.sql')
      
      // Try to continue without history tracking
      console.log('Super Actions API: Continuing without history tracking...')
    }

    // Process in batches
    console.log('Super Actions API: Starting to process emails in batches')
    for (let i = 0; i < emailsToProcess.length; i += batchSize) {
      const batch = emailsToProcess.slice(i, i + batchSize)
      console.log(`Super Actions API: Processing batch ${Math.floor(i/batchSize) + 1}, emails: ${batch.length}`)
      
      const batchPromises = batch.map(async (emailId) => {
        try {
          let response
          
          if (isArchive) {
            // Archive email (remove INBOX label)
            response = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}/modify`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  removeLabelIds: ['INBOX']
                })
              }
            )
          } else {
            // Move to trash
            response = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}/trash`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            )
          }
          
          if (response.ok) {
            processedCount++
            return true
          } else {
            const errorText = await response.text()
            console.error(`Failed to process email ${emailId}: ${response.status} - ${errorText}`)
            failedCount++
            return false
          }
        } catch (err) {
          console.error(`Error processing email ${emailId}:`, err)
          failedCount++
          return false
        }
      })

      await Promise.all(batchPromises)
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < emailsToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`Super Actions API: Processing complete. Success: ${processedCount}, Failed: ${failedCount}`)

    // Update action history with results (if it exists)
    if (actionHistory?.id) {
      const { error: updateError } = await supabase
        .from('action_history')
        .update({
          status: failedCount === 0 ? 'completed' : 'partially_failed',
          completed_at: new Date().toISOString(),
          error_details: failedCount > 0 ? { failedCount } : null
        })
        .eq('id', actionHistory.id)

      if (updateError) {
        console.error('Super Actions API: Error updating action_history:', updateError)
      }
    }

    // Track individual email actions
    const emailHistoryEntries = emailsToProcess.slice(0, processedCount).map(emailId => {
      const email = allEmails.find((e: any) => e.id === emailId)
      return {
        user_id: user.id,
        email_id: emailId,
        action: isArchive ? 'archive' : 'delete',
        action_type: 'automated',
        details: {
          super_action: action,
          subject: email?.subject,
          from: email?.from,
          snippet: email?.snippet
        }
      }
    })

    if (emailHistoryEntries.length > 0) {
      const { error: emailHistoryError } = await supabase
        .from('email_history')
        .insert(emailHistoryEntries)
      
      if (emailHistoryError) {
        console.error('Super Actions API: Error tracking in email_history:', emailHistoryError)
      }
    }

    return NextResponse.json({
      success: true,
      processedCount,
      failedCount,
      message: `Successfully processed ${processedCount} emails${failedCount > 0 ? ` (${failedCount} failed)` : ''}`
    })

  } catch (error) {
    console.error('Super Actions API: Unexpected error:', error)
    console.error('Super Actions API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json({ 
      success: false, 
      error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}