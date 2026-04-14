-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table to manage user permissions
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Only admins can manage roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ==========================================
-- Secure pipeline_prospec_minoru table
-- ==========================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Permitir leitura pública de métricas" ON public.pipeline_prospec_minoru;
DROP POLICY IF EXISTS "Permitir inserção pública de métricas" ON public.pipeline_prospec_minoru;
DROP POLICY IF EXISTS "Permitir atualização pública de métricas" ON public.pipeline_prospec_minoru;
DROP POLICY IF EXISTS "Permitir exclusão pública de métricas" ON public.pipeline_prospec_minoru;

-- Create secure policies requiring authentication
CREATE POLICY "Authenticated users can view metrics"
ON public.pipeline_prospec_minoru
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert metrics"
ON public.pipeline_prospec_minoru
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update metrics"
ON public.pipeline_prospec_minoru
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete metrics"
ON public.pipeline_prospec_minoru
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- Secure pipeline_prospec_elyano table
-- ==========================================

DROP POLICY IF EXISTS "Permitir leitura pública de métricas" ON public.pipeline_prospec_elyano;
DROP POLICY IF EXISTS "Permitir inserção pública de métricas" ON public.pipeline_prospec_elyano;
DROP POLICY IF EXISTS "Permitir atualização pública de métricas" ON public.pipeline_prospec_elyano;
DROP POLICY IF EXISTS "Permitir exclusão pública de métricas" ON public.pipeline_prospec_elyano;

CREATE POLICY "Authenticated users can view metrics"
ON public.pipeline_prospec_elyano
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert metrics"
ON public.pipeline_prospec_elyano
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update metrics"
ON public.pipeline_prospec_elyano
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete metrics"
ON public.pipeline_prospec_elyano
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- Secure pipeline_prospec_marcos_rossi table
-- ==========================================

DROP POLICY IF EXISTS "Permitir leitura pública de métricas" ON public.pipeline_prospec_marcos_rossi;
DROP POLICY IF EXISTS "Permitir inserção pública de métricas" ON public.pipeline_prospec_marcos_rossi;
DROP POLICY IF EXISTS "Permitir atualização pública de métricas" ON public.pipeline_prospec_marcos_rossi;
DROP POLICY IF EXISTS "Permitir exclusão pública de métricas" ON public.pipeline_prospec_marcos_rossi;

CREATE POLICY "Authenticated users can view metrics"
ON public.pipeline_prospec_marcos_rossi
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert metrics"
ON public.pipeline_prospec_marcos_rossi
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update metrics"
ON public.pipeline_prospec_marcos_rossi
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete metrics"
ON public.pipeline_prospec_marcos_rossi
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- Secure pipeline_prospec_bp_results table
-- ==========================================

DROP POLICY IF EXISTS "Permitir leitura pública de métricas" ON public.pipeline_prospec_bp_results;
DROP POLICY IF EXISTS "Permitir inserção pública de métricas" ON public.pipeline_prospec_bp_results;
DROP POLICY IF EXISTS "Permitir atualização pública de métricas" ON public.pipeline_prospec_bp_results;
DROP POLICY IF EXISTS "Permitir exclusão pública de métricas" ON public.pipeline_prospec_bp_results;

CREATE POLICY "Authenticated users can view metrics"
ON public.pipeline_prospec_bp_results
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert metrics"
ON public.pipeline_prospec_bp_results
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update metrics"
ON public.pipeline_prospec_bp_results
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete metrics"
ON public.pipeline_prospec_bp_results
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));