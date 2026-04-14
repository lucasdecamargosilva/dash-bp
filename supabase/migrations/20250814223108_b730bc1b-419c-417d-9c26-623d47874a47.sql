-- Phase 1: Critical Data Protection - Secure all business data tables

-- 1. Enable RLS on monthly_data table and add proper policies (with proper cleanup)
ALTER TABLE public.monthly_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Authenticated users can view monthly data" ON public.monthly_data;
DROP POLICY IF EXISTS "Authenticated users can insert monthly data" ON public.monthly_data;
DROP POLICY IF EXISTS "Authenticated users can update monthly data" ON public.monthly_data;
DROP POLICY IF EXISTS "Authenticated users can delete monthly data" ON public.monthly_data;

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
DROP POLICY IF EXISTS "Authenticated users can view acquisition metrics" ON public.acquisition_channel_metrics;

CREATE POLICY "Authenticated users can view acquisition metrics" 
ON public.acquisition_channel_metrics 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 3. Remove public access to channels table
DROP POLICY IF EXISTS "Anyone can view channels" ON public.channels;
DROP POLICY IF EXISTS "Authenticated users can view channels" ON public.channels;

CREATE POLICY "Authenticated users can view channels" 
ON public.channels 
FOR SELECT 
USING (auth.uid() IS NOT NULL);