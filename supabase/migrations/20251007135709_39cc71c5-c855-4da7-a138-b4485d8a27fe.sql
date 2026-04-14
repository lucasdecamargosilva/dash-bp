-- Create a security definer function to check if user is authorized
CREATE OR REPLACE FUNCTION public.is_authorized_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
      AND email IN ('raphaelacioli@bpgroupbr.com.br', 'lucasdecamargo2015@gmail.com')
  );
$$;

-- Drop existing policies for clients table
DROP POLICY IF EXISTS "Authenticated users can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update all clients" ON public.clients;

-- Create new policies for clients table
CREATE POLICY "Only authorized users can view clients"
ON public.clients
FOR SELECT
TO authenticated
USING (public.is_authorized_user());

CREATE POLICY "Only authorized users can insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (public.is_authorized_user());

CREATE POLICY "Only authorized users can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (public.is_authorized_user());

-- Drop existing policies for monthly_data table
DROP POLICY IF EXISTS "Authenticated users can view monthly data" ON public.monthly_data;
DROP POLICY IF EXISTS "Authenticated users can insert monthly data" ON public.monthly_data;
DROP POLICY IF EXISTS "Authenticated users can update monthly data" ON public.monthly_data;
DROP POLICY IF EXISTS "Authenticated users can delete monthly data" ON public.monthly_data;

-- Create new policies for monthly_data table
CREATE POLICY "Only authorized users can view monthly data"
ON public.monthly_data
FOR SELECT
TO authenticated
USING (public.is_authorized_user());

CREATE POLICY "Only authorized users can insert monthly data"
ON public.monthly_data
FOR INSERT
TO authenticated
WITH CHECK (public.is_authorized_user());

CREATE POLICY "Only authorized users can update monthly data"
ON public.monthly_data
FOR UPDATE
TO authenticated
USING (public.is_authorized_user());

CREATE POLICY "Only authorized users can delete monthly data"
ON public.monthly_data
FOR DELETE
TO authenticated
USING (public.is_authorized_user());

-- Drop existing policies for channels table
DROP POLICY IF EXISTS "Authenticated users can view channels" ON public.channels;
DROP POLICY IF EXISTS "Authenticated users can insert channels" ON public.channels;
DROP POLICY IF EXISTS "Authenticated users can update channels" ON public.channels;

-- Create new policies for channels table
CREATE POLICY "Only authorized users can view channels"
ON public.channels
FOR SELECT
TO authenticated
USING (public.is_authorized_user());

CREATE POLICY "Only authorized users can insert channels"
ON public.channels
FOR INSERT
TO authenticated
WITH CHECK (public.is_authorized_user());

CREATE POLICY "Only authorized users can update channels"
ON public.channels
FOR UPDATE
TO authenticated
USING (public.is_authorized_user());

-- Drop existing policies for acquisition_channel_metrics table
DROP POLICY IF EXISTS "Authenticated users can view acquisition metrics" ON public.acquisition_channel_metrics;
DROP POLICY IF EXISTS "Authenticated users can insert acquisition metrics" ON public.acquisition_channel_metrics;
DROP POLICY IF EXISTS "Authenticated users can update acquisition metrics" ON public.acquisition_channel_metrics;
DROP POLICY IF EXISTS "Authenticated users can delete acquisition metrics" ON public.acquisition_channel_metrics;

-- Create new policies for acquisition_channel_metrics table
CREATE POLICY "Only authorized users can view acquisition metrics"
ON public.acquisition_channel_metrics
FOR SELECT
TO authenticated
USING (public.is_authorized_user());

CREATE POLICY "Only authorized users can insert acquisition metrics"
ON public.acquisition_channel_metrics
FOR INSERT
TO authenticated
WITH CHECK (public.is_authorized_user());

CREATE POLICY "Only authorized users can update acquisition metrics"
ON public.acquisition_channel_metrics
FOR UPDATE
TO authenticated
USING (public.is_authorized_user());

CREATE POLICY "Only authorized users can delete acquisition metrics"
ON public.acquisition_channel_metrics
FOR DELETE
TO authenticated
USING (public.is_authorized_user());