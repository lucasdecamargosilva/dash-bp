-- First, let's check if we need to add period filtering to channels
-- We already have a 'month' column in channels table that stores the period (YYYY-MM format)
-- Let's add some helper functions to make period filtering easier

-- Function to check if a month/period falls within a date range
CREATE OR REPLACE FUNCTION is_month_in_range(month_str text, start_date date, end_date date)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    month_date date;
BEGIN
    -- Handle null cases
    IF month_str IS NULL OR start_date IS NULL OR end_date IS NULL THEN
        RETURN false;
    END IF;
    
    -- Convert YYYY-MM format to date (first day of the month)
    BEGIN
        month_date := (month_str || '-01')::date;
    EXCEPTION WHEN OTHERS THEN
        RETURN false;
    END;
    
    -- Check if the month falls within the range
    RETURN month_date >= start_date AND month_date <= end_date;
END;
$$;

-- Function to get current month in YYYY-MM format
CREATE OR REPLACE FUNCTION get_current_month()
RETURNS text
LANGUAGE sql
AS $$
    SELECT to_char(CURRENT_DATE, 'YYYY-MM');
$$;

-- Function to get last month in YYYY-MM format
CREATE OR REPLACE FUNCTION get_last_month()
RETURNS text
LANGUAGE sql
AS $$
    SELECT to_char(CURRENT_DATE - interval '1 month', 'YYYY-MM');
$$;

-- Update the upsert_channel_monthly_data function to ensure month is always set
CREATE OR REPLACE FUNCTION public.upsert_channel_monthly_data(
    p_client_id uuid, 
    p_month text, 
    p_name text, 
    p_contacts integer DEFAULT 0, 
    p_qualified_leads integer DEFAULT 0, 
    p_meetings integer DEFAULT 0, 
    p_proposals integer DEFAULT 0, 
    p_sales integer DEFAULT 0, 
    p_revenue integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  channel_id UUID;
  final_month text;
BEGIN
  -- Use provided month or default to current month
  final_month := COALESCE(p_month, get_current_month());
  
  -- Try to find existing channel for this client, name, and month
  SELECT id INTO channel_id 
  FROM public.channels 
  WHERE client_id = p_client_id 
    AND name = p_name 
    AND month = final_month;
  
  IF channel_id IS NULL THEN
    -- Insert new channel with month data
    INSERT INTO public.channels (
      client_id, name, month, contacts, qualified_leads, 
      meetings, proposals, sales, revenue
    ) VALUES (
      p_client_id, p_name, final_month, p_contacts, p_qualified_leads,
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
$$;