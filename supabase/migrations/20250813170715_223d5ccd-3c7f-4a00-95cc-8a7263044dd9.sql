-- Add month field to channels table to store month-specific data
ALTER TABLE public.channels ADD COLUMN month TEXT DEFAULT NULL;

-- Create unique constraint to prevent duplicate channel names for same client and month
-- Drop existing constraint first if it exists
-- ALTER TABLE public.channels DROP CONSTRAINT IF EXISTS channels_client_id_name_month_key;

-- Add new constraint to ensure unique channel per client per month
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS channels_client_id_name_month_key 
ON public.channels(client_id, name, month) 
WHERE month IS NOT NULL;

-- Create function to update channel data for specific month
CREATE OR REPLACE FUNCTION upsert_channel_monthly_data(
  p_client_id UUID,
  p_month TEXT,
  p_name TEXT,
  p_contacts INTEGER DEFAULT 0,
  p_qualified_leads INTEGER DEFAULT 0,
  p_meetings INTEGER DEFAULT 0,
  p_proposals INTEGER DEFAULT 0,
  p_sales INTEGER DEFAULT 0,
  p_revenue INTEGER DEFAULT 0
) RETURNS UUID AS $$
DECLARE
  channel_id UUID;
BEGIN
  -- Try to find existing channel for this client, name, and month
  SELECT id INTO channel_id 
  FROM public.channels 
  WHERE client_id = p_client_id 
    AND name = p_name 
    AND month = p_month;
  
  IF channel_id IS NULL THEN
    -- Insert new channel with month data
    INSERT INTO public.channels (
      client_id, name, month, contacts, qualified_leads, 
      meetings, proposals, sales, revenue
    ) VALUES (
      p_client_id, p_name, p_month, p_contacts, p_qualified_leads,
      p_meetings, p_proposals, p_sales, p_revenue
    ) RETURNING id INTO channel_id;
  ELSE
    -- Update existing channel
    UPDATE public.channels SET
      contacts = p_contacts,
      qualified_leads = p_qualified_leads,
      meetings = p_meetings,
      proposals = p_proposals,
      sales = p_sales,
      revenue = p_revenue,
      updated_at = now()
    WHERE id = channel_id;
  END IF;
  
  RETURN channel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;