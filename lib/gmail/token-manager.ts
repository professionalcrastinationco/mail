import { createClient } from '@/lib/supabase/client'

interface TokenData {
  access_token: string
  refresh_token?: string
  expires_at: number
}

class GmailTokenManager {
  private static instance: GmailTokenManager
  private tokenData: TokenData | null = null
  private supabase = createClient()

  private constructor() {}

  static getInstance(): GmailTokenManager {
    if (!GmailTokenManager.instance) {
      GmailTokenManager.instance = new GmailTokenManager()
    }
    return GmailTokenManager.instance
  }

  /**
   * Store tokens in database after OAuth callback
   */
  async storeTokens(userId: string, accessToken: string, refreshToken?: string, expiresIn: number = 3600) {
    const expiresAt = Date.now() + (expiresIn * 1000)
    
    const { error } = await this.supabase
      .from('gmail_tokens')
      .upsert({
        user_id: userId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: new Date(expiresAt).toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Failed to store Gmail tokens:', error)
      throw error
    }

    // Cache in memory
    this.tokenData = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    // Check memory cache first
    if (this.tokenData && this.tokenData.expires_at > Date.now() + 60000) {
      return this.tokenData.access_token
    }

    // Fetch from database
    const { data: tokenRecord, error } = await this.supabase
      .from('gmail_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error || !tokenRecord) {
      // No stored tokens, try to get from current session
      const { data: { session } } = await this.supabase.auth.getSession()
      if (session?.provider_token) {
        // Store it for future use
        await this.storeTokens(user.id, session.provider_token, session.provider_refresh_token)
        return session.provider_token
      }
      throw new Error('No Gmail tokens found. Please reconnect your Gmail account.')
    }

    const expiresAt = new Date(tokenRecord.expires_at).getTime()
    
    // Token is still valid
    if (expiresAt > Date.now() + 60000) {
      this.tokenData = {
        access_token: tokenRecord.access_token,
        refresh_token: tokenRecord.refresh_token,
        expires_at: expiresAt
      }
      return tokenRecord.access_token
    }

    // Token expired, refresh it
    if (!tokenRecord.refresh_token) {
      throw new Error('No refresh token available. Please reconnect your Gmail account.')
    }

    return await this.refreshAccessToken(user.id, tokenRecord.refresh_token)
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
    try {
      // Use the server-side endpoint to refresh the token
      const response = await fetch('/api/gmail/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Token refresh failed:', error)
        throw new Error('Failed to refresh Gmail access token')
      }

      const data = await response.json()
      
      // Update the cached token
      this.tokenData = {
        access_token: data.access_token,
        refresh_token: refreshToken,
        expires_at: new Date(data.expires_at).getTime()
      }

      return data.access_token
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw new Error('Failed to refresh Gmail access token. Please reconnect your Gmail account.')
    }
  }

  /**
   * Clear cached tokens
   */
  clearCache() {
    this.tokenData = null
  }

  /**
   * Check if user has valid Gmail connection
   */
  async hasValidConnection(): Promise<boolean> {
    try {
      await this.getAccessToken()
      return true
    } catch {
      return false
    }
  }
}

export const gmailTokenManager = GmailTokenManager.getInstance()
