-- STOP WHAT YOU'RE DOING AND RUN THIS IN SUPABASE
-- Go to: https://app.supabase.com/project/ovdrybotgfxtngfkwlem/sql/new
-- Paste all of this and hit RUN

-- ============================================
-- 1. Gmail Tokens Table (if not already created)
-- ============================================
CREATE TABLE IF NOT EXISTS gmail_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tokens" ON gmail_tokens
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tokens" ON gmail_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tokens" ON gmail_tokens
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tokens" ON gmail_tokens
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_gmail_tokens_user_id ON gmail_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_expires_at ON gmail_tokens(expires_at);

-- ============================================
-- 2. Safe Senders Table (might already exist)
-- ============================================
CREATE TABLE IF NOT EXISTS safe_senders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_address)
);

CREATE INDEX IF NOT EXISTS idx_safe_senders_user_id ON safe_senders(user_id);

ALTER TABLE safe_senders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own safe senders" ON safe_senders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own safe senders" ON safe_senders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own safe senders" ON safe_senders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own safe senders" ON safe_senders
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. Action History Table (THIS IS THE MISSING ONE!)
-- ============================================
CREATE TABLE IF NOT EXISTS action_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('super_delete', 'super_archive', 'super_unsubscribe', 'mass_delete', 'mass_archive')),
  affected_emails JSONB,
  affected_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'undone', 'partially_failed')),
  can_undo_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_details JSONB,
  undo_performed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_action_history_user_id ON action_history(user_id);
CREATE INDEX IF NOT EXISTS idx_action_history_status ON action_history(status);
CREATE INDEX IF NOT EXISTS idx_action_history_can_undo ON action_history(can_undo_until) WHERE can_undo_until IS NOT NULL;

ALTER TABLE action_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own action history" ON action_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own action history" ON action_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own action history" ON action_history
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 4. Email History Table (probably already exists)
-- ============================================
CREATE TABLE IF NOT EXISTS email_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('delete', 'archive', 'mark_read', 'mark_unread', 'label', 'unlabel')),
  action_type TEXT NOT NULL CHECK (action_type IN ('manual', 'automated', 'rule')),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_history_user_id ON email_history(user_id);
CREATE INDEX IF NOT EXISTS idx_email_history_email_id ON email_history(email_id);
CREATE INDEX IF NOT EXISTS idx_email_history_created_at ON email_history(created_at DESC);

ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email history" ON email_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own email history" ON email_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- DONE! Now your Super Actions should work
-- ============================================