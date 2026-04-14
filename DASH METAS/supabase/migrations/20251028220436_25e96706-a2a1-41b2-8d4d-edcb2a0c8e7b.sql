-- Enable service_role to bypass RLS for pipeline tables
-- This allows n8n to insert/update records using the service_role key

-- Pipeline Elyano
CREATE POLICY "Service role can insert metrics"
ON public.pipeline_prospec_elyano
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update metrics"
ON public.pipeline_prospec_elyano
FOR UPDATE
TO service_role
USING (true);

-- Pipeline Minoru
CREATE POLICY "Service role can insert metrics"
ON public.pipeline_prospec_minoru
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update metrics"
ON public.pipeline_prospec_minoru
FOR UPDATE
TO service_role
USING (true);

-- Pipeline Marcos Rossi
CREATE POLICY "Service role can insert metrics"
ON public.pipeline_prospec_marcos_rossi
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update metrics"
ON public.pipeline_prospec_marcos_rossi
FOR UPDATE
TO service_role
USING (true);

-- Pipeline BP Results
CREATE POLICY "Service role can insert metrics"
ON public.pipeline_prospec_bp_results
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update metrics"
ON public.pipeline_prospec_bp_results
FOR UPDATE
TO service_role
USING (true);