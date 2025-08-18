import { createClient } from '@/lib/supabase/client'

// Gmail API rate limits (being conservative)
const RATE_LIMITS = {
  ACTIONS_PER_SECOND: 20,  // 75% of Gmail's actual limit
  BATCH_SIZE: 50,          // Process 50 emails at a time
  DELAY_BETWEEN_BATCHES: 2500  // 2.5 seconds between batches
}

interface RateLimiterOptions {
  userId: string
  actionType: string
}

export class GmailRateLimiter {
  private supabase = createClient()
  private userId: string
  private actionType: string
  private currentBatch: number = 0
  private totalBatches: number = 0

  constructor({ userId, actionType }: RateLimiterOptions) {
    this.userId = userId
    this.actionType = actionType
  }

  /**
   * Check if we can perform an action without hitting rate limits
   */
  async canPerformAction(): Promise<boolean> {
    const now = new Date()
    const windowStart = new Date(now.getTime() - 60000) // 1 minute ago

    // Check current rate limit usage
    const { data, error } = await this.supabase
      .from('rate_limit_tracking')
      .select('actions_count')
      .eq('user_id', this.userId)
      .gte('window_end', now.toISOString())
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking rate limit:', error)
      return false
    }

    // If no current window, we can proceed
    if (!data) {
      await this.createRateLimitWindow()
      return true
    }

    // Check if we're under the limit
    return data.actions_count < (RATE_LIMITS.ACTIONS_PER_SECOND * 60)
  }

  /**
   * Create a new rate limit tracking window
   */
  private async createRateLimitWindow() {
    const now = new Date()
    const windowEnd = new Date(now.getTime() + 60000) // 1 minute from now

    await this.supabase
      .from('rate_limit_tracking')
      .insert([{
        user_id: this.userId,
        action_type: this.actionType,
        actions_count: 0,
        window_start: now.toISOString(),
        window_end: windowEnd.toISOString()
      }])
  }

  /**
   * Record that we performed actions
   */
  async recordActions(count: number) {
    const now = new Date()

    // First get the current count
    const { data } = await this.supabase
      .from('rate_limit_tracking')
      .select('actions_count')
      .eq('user_id', this.userId)
      .gte('window_end', now.toISOString())
      .single()

    if (data) {
      // Update with new count
      const { error } = await this.supabase
        .from('rate_limit_tracking')
        .update({ 
          actions_count: data.actions_count + count
        })
        .eq('user_id', this.userId)
        .gte('window_end', now.toISOString())

      if (error) {
        console.error('Error recording actions:', error)
      }
    }
  }

  /**
   * Split emails into batches for processing
   */
  createBatches<T>(items: T[]): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += RATE_LIMITS.BATCH_SIZE) {
      batches.push(items.slice(i, i + RATE_LIMITS.BATCH_SIZE))
    }
    this.totalBatches = batches.length
    return batches
  }

  /**
   * Process a batch with rate limiting
   */
  async processBatch<T>(
    batch: T[],
    processor: (item: T) => Promise<void>,
    onProgress?: (processed: number, total: number) => void
  ): Promise<{ succeeded: T[], failed: T[] }> {
    const succeeded: T[] = []
    const failed: T[] = []

    // Check rate limit before processing
    if (!await this.canPerformAction()) {
      // Wait before retrying
      await this.delay(RATE_LIMITS.DELAY_BETWEEN_BATCHES * 2)
    }

    // Process items in the batch
    for (const item of batch) {
      try {
        await processor(item)
        succeeded.push(item)
      } catch (error) {
        console.error('Error processing item:', error)
        failed.push(item)
      }

      // Update progress
      if (onProgress) {
        onProgress(succeeded.length, batch.length)
      }

      // Small delay between individual actions
      await this.delay(50)
    }

    // Record the actions we performed
    await this.recordActions(succeeded.length)

    return { succeeded, failed }
  }

  /**
   * Process all batches with rate limiting
   */
  async processAllBatches<T>(
    batches: T[][],
    processor: (item: T) => Promise<void>,
    onProgress?: (batchNumber: number, totalBatches: number, processed: number, total: number) => void
  ): Promise<{ totalSucceeded: number, totalFailed: number, failedItems: T[] }> {
    let totalSucceeded = 0
    let totalFailed = 0
    const allFailedItems: T[] = []

    for (let i = 0; i < batches.length; i++) {
      this.currentBatch = i + 1
      
      // Process the batch
      const { succeeded, failed } = await this.processBatch(
        batches[i],
        processor,
        (processed, total) => {
          if (onProgress) {
            onProgress(this.currentBatch, this.totalBatches, processed, total)
          }
        }
      )

      totalSucceeded += succeeded.length
      totalFailed += failed.length
      allFailedItems.push(...failed)

      // Delay between batches
      if (i < batches.length - 1) {
        await this.delay(RATE_LIMITS.DELAY_BETWEEN_BATCHES)
      }
    }

    return {
      totalSucceeded,
      totalFailed,
      failedItems: allFailedItems
    }
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get current processing status
   */
  getStatus() {
    return {
      currentBatch: this.currentBatch,
      totalBatches: this.totalBatches,
      batchSize: RATE_LIMITS.BATCH_SIZE,
      actionsPerSecond: RATE_LIMITS.ACTIONS_PER_SECOND
    }
  }
}