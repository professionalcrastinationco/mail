-- Add wildcard support for Safe Senders

-- Function to check if an email matches a safe sender pattern
CREATE OR REPLACE FUNCTION email_matches_safe_sender(
  p_email TEXT,
  p_pattern TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Exact match
  IF p_email = p_pattern THEN
    RETURN TRUE;
  END IF;
  
  -- Domain wildcard: *@domain.com
  IF p_pattern LIKE '*@%' THEN
    RETURN p_email LIKE '%' || SUBSTRING(p_pattern FROM 2);
  END IF;
  
  -- Prefix wildcard: prefix@*
  IF p_pattern LIKE '%@*' THEN
    RETURN p_email LIKE SUBSTRING(p_pattern FROM 1 FOR LENGTH(p_pattern) - 1) || '%';
  END IF;
  
  -- Full wildcard: *word*
  IF p_pattern LIKE '*%*' THEN
    RETURN p_email LIKE '%' || REPLACE(REPLACE(p_pattern, '*', ''), '@', '') || '%';
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if email is in safe senders list (with wildcard support)
CREATE OR REPLACE FUNCTION is_safe_sender(
  p_user_id UUID,
  p_email TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_safe BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM safe_senders 
    WHERE user_id = p_user_id 
      AND email_matches_safe_sender(LOWER(p_email), LOWER(email_address))
  ) INTO v_is_safe;
  
  RETURN v_is_safe;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;