-- Phase 1: Critical Data Protection - Secure all business data tables

-- 1. Enable RLS on monthly_data table and add proper policies
ALTER TABLE public.monthly_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view monthly data" 
ON public.monthly_data 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert monthly data" 
ON public.monthly_data 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update monthly data" 
ON public.monthly_data 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete monthly data" 
ON public.monthly_data 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- 2. Remove public access to acquisition_channel_metrics
DROP POLICY IF EXISTS "Anyone can view acquisition metrics" ON public.acquisition_channel_metrics;

CREATE POLICY "Authenticated users can view acquisition metrics" 
ON public.acquisition_channel_metrics 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 3. Remove public access to channels table
DROP POLICY IF EXISTS "Anyone can view channels" ON public.channels;

CREATE POLICY "Authenticated users can view channels" 
ON public.channels 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Phase 2: Database Security Hardening - Fix all database functions

-- Update function to set proper search path
CREATE OR REPLACE FUNCTION public.is_month_in_range(month_str text, start_date date, end_date date)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;

-- Update function to set proper search path
CREATE OR REPLACE FUNCTION public.get_current_month()
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
    SELECT to_char(CURRENT_DATE, 'YYYY-MM');
$function$;

-- Update function to set proper search path
CREATE OR REPLACE FUNCTION public.get_last_month()
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
    SELECT to_char(CURRENT_DATE - interval '1 month', 'YYYY-MM');
$function$;

-- Update function to set proper search path
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update function to set proper search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- Update function to set proper search path
CREATE OR REPLACE FUNCTION public.upsert_channel_monthly_data(p_client_id uuid, p_month text, p_name text, p_contacts integer DEFAULT 0, p_qualified_leads integer DEFAULT 0, p_meetings integer DEFAULT 0, p_proposals integer DEFAULT 0, p_sales integer DEFAULT 0, p_revenue integer DEFAULT 0)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  channel_id UUID;
  final_month text;
BEGIN
  -- Use provided month or default to current month
  final_month := COALESCE(p_month, public.get_current_month());
  
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
$function$;

-- Update handle_new_user function to set proper search path  
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id, 
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$function$;