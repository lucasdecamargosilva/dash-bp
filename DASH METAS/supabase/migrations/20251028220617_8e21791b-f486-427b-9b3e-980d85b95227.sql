-- Drop existing service role policies and create policies for anon role
-- This allows n8n to insert/update records using the anon key

-- Pipeline Elyano
DROP POLICY IF EXISTS "Service role can insert metrics" ON public.pipeline_prospec_elyano;
DROP POLICY IF EXISTS "Service role can update metrics" ON public.pipeline_prospec_elyano;

CREATE POLICY "Allow anon insert metrics"
ON public.pipeline_prospec_elyano
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon update metrics"
ON public.pipeline_prospec_elyano
FOR UPDATE
TO anon
USING (true);

-- Pipeline Minoru
DROP POLICY IF EXISTS "Service role can insert metrics" ON public.pipeline_prospec_minoru;
DROP POLICY IF EXISTS "Service role can update metrics" ON public.pipeline_prospec_minoru;

CREATE POLICY "Allow anon insert metrics"
ON public.pipeline_prospec_minoru
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon update metrics"
ON public.pipeline_prospec_minoru
FOR UPDATE
TO anon
USING (true);

-- Pipeline Marcos Rossi
DROP POLICY IF EXISTS "Service role can insert metrics" ON public.pipeline_prospec_marcos_rossi;
DROP POLICY IF EXISTS "Service role can update metrics" ON public.pipeline_prospec_marcos_rossi;

CREATE POLICY "Allow anon insert metrics"
ON public.pipeline_prospec_marcos_rossi
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon update metrics"
ON public.pipeline_prospec_marcos_rossi
FOR UPDATE
TO anon
USING (true);

-- Pipeline BP Results
DROP POLICY IF EXISTS "Service role can insert metrics" ON public.pipeline_prospec_bp_results;
DROP POLICY IF EXISTS "Service role can update metrics" ON public.pipeline_prospec_bp_results;

CREATE POLICY "Allow anon insert metrics"
ON public.pipeline_prospec_bp_results
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon update metrics"
ON public.pipeline_prospec_bp_results
FOR UPDATE
TO anon
USING (true);