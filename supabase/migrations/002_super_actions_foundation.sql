-- Phase 1: Super Actions Foundation Tables

-- Safe senders list
CREATE TABLE IF NOT EXISTS safe_senders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_address) -- Prevent duplicate entries
);

-- Rules table for Super Actions
CREATE TABLE IF NOT EXISTS super_action_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('delete', 'archive', 'label', 'unsubscribe')),
  match_criteria JSONB NOT NULL, -- {sender_type: "exact|domain|pattern", sender: "...", subject_type: "exact|contains", subject: "..."}
  priority INTEGER NOT NULL DEFAULT 999,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_action_id UUID, -- Will reference action_history once created
  UNIQUE(user_id, priority) -- Ensure unique priorities per user
);

-- Super Actions history
CREATE TABLE IF NOT EXISTS action_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('super_delete', 'super_archive', 'super_unsubscribe', 'mass_delete', 'mass_archive')),
  affected_emails JSONB, -- Array of message IDs
  affected_count INTEGER DEFAULT 0,
  rule_created UUID REFERENCES super_action_rules(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'undone', 'partially_failed')),
  can_undo_until TIMESTAMPTZ, -- created_at + 29 days
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_details JSONB,
  undo_performed_at TIMESTAMPTZ
);

-- Add foreign key constraint for created_by_action_id
ALTER TABLE super_action_rules 
  ADD CONSTRAINT fk_created_by_action 
  FOREIGN KEY (created_by_action_id) 
  REFERENCES action_history(id) 
  ON DELETE SET NULL;

-- Batch processing queue
CREATE TABLE IF NOT EXISTS processing_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id UUID REFERENCES action_history(id) ON DELETE CASCADE,
  batch_data JSONB NOT NULL, -- Emails to process in this batch
  batch_number INTEGER NOT NULL,
  total_batches INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  processed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- User settings and progress tracking
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  safe_senders_required BOOLEAN DEFAULT true,
  safe_senders_count INTEGER DEFAULT 0,
  training_mode_active BOOLEAN DEFAULT true,
  successful_actions_count INTEGER DEFAULT 0,
  failed_actions_count INTEGER DEFAULT 0,
  days_limit INTEGER DEFAULT 30, -- Current unlock level (30, 90, or null for unlimited)
  training_warnings_dismissed JSONB DEFAULT '{}', -- Tracks which warnings they've accepted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API rate limit tracking
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  actions_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 minute'
);

-- Indexes for performance
CREATE INDEX idx_safe_senders_user_id ON safe_senders(user_id);
CREATE INDEX idx_super_action_rules_user_id ON super_action_rules(user_id);
CREATE INDEX idx_super_action_rules_priority ON super_action_rules(user_id, priority);
CREATE INDEX idx_action_history_user_id ON action_history(user_id);
CREATE INDEX idx_action_history_status ON action_history(status);
CREATE INDEX idx_action_history_can_undo ON action_history(can_undo_until) WHERE can_undo_until IS NOT NULL;
CREATE INDEX idx_processing_queue_status ON processing_queue(status);
CREATE INDEX idx_processing_queue_action_id ON processing_queue(action_id);
CREATE INDEX idx_rate_limit_user_window ON rate_limit_tracking(user_id, window_end);

-- Enable Row Level Security
ALTER TABLE safe_senders ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_action_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for safe_senders
CREATE POLICY "Users can view own safe senders" ON safe_senders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own safe senders" ON safe_senders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own safe senders" ON safe_senders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own safe senders" ON safe_senders
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for super_action_rules
CREATE POLICY "Users can view own rules" ON super_action_rules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rules" ON super_action_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rules" ON super_action_rules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rules" ON super_action_rules
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for action_history
CREATE POLICY "Users can view own action history" ON action_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own action history" ON action_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own action history" ON action_history
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for processing_queue
CREATE POLICY "Users can view own queue" ON processing_queue
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own queue items" ON processing_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own queue items" ON processing_queue
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for rate_limit_tracking
CREATE POLICY "Users can view own rate limits" ON rate_limit_tracking
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rate limits" ON rate_limit_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rate limits" ON rate_limit_tracking
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to check if user can use Super Actions
CREATE OR REPLACE FUNCTION can_use_super_actions(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_safe_senders_count INTEGER;
  v_safe_senders_required BOOLEAN;
BEGIN
  -- Get user settings
  SELECT safe_senders_required, safe_senders_count
  INTO v_safe_senders_required, v_safe_senders_count
  FROM user_settings
  WHERE user_id = p_user_id;
  
  -- If no settings exist, user needs to set up safe senders
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- If safe senders not required (user dismissed warnings), allow
  IF NOT v_safe_senders_required THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has at least 3 safe senders
  RETURN v_safe_senders_count >= 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update safe senders count
CREATE OR REPLACE FUNCTION update_safe_senders_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the count in user_settings
  INSERT INTO user_settings (user_id, safe_senders_count, updated_at)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    (SELECT COUNT(*) FROM safe_senders WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    safe_senders_count = (SELECT COUNT(*) FROM safe_senders WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update safe senders count
CREATE TRIGGER update_safe_senders_count_trigger
AFTER INSERT OR DELETE ON safe_senders
FOR EACH ROW
EXECUTE FUNCTION update_safe_senders_count();

-- Function to clean up old undo-able actions
CREATE OR REPLACE FUNCTION cleanup_expired_undo_actions()
RETURNS void AS $$
BEGIN
  UPDATE action_history 
  SET status = 'completed'
  WHERE status = 'completed' 
    AND can_undo_until < NOW()
    AND can_undo_until IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;