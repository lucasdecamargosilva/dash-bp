-- Remove all existing policies and create simple public policies
-- This allows n8n to insert/update without authentication

-- Pipeline Elyano
DROP POLICY IF EXISTS "Authenticated users can view metrics" ON public.pipeline_prospec_elyano;
DROP POLICY IF EXISTS "Admins can insert metrics" ON public.pipeline_prospec_elyano;
DROP POLICY IF EXISTS "Admins can update metrics" ON public.pipeline_prospec_elyano;
DROP POLICY IF EXISTS "Admins can delete metrics" ON public.pipeline_prospec_elyano;
DROP POLICY IF EXISTS "Allow anon insert metrics" ON public.pipeline_prospec_elyano;
DROP POLICY IF EXISTS "Allow anon update metrics" ON public.pipeline_prospec_elyano;

CREATE POLICY "Allow public insert" ON public.pipeline_prospec_elyano
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.pipeline_prospec_elyano
  FOR UPDATE USING (true);

CREATE POLICY "Allow public select" ON public.pipeline_prospec_elyano
  FOR SELECT USING (true);

-- Pipeline Minoru
DROP POLICY IF EXISTS "Authenticated users can view metrics" ON public.pipeline_prospec_minoru;
DROP POLICY IF EXISTS "Admins can insert metrics" ON public.pipeline_prospec_minoru;
DROP POLICY IF EXISTS "Admins can update metrics" ON public.pipeline_prospec_minoru;
DROP POLICY IF EXISTS "Admins can delete metrics" ON public.pipeline_prospec_minoru;
DROP POLICY IF EXISTS "Allow anon insert metrics" ON public.pipeline_prospec_minoru;
DROP POLICY IF EXISTS "Allow anon update metrics" ON public.pipeline_prospec_minoru;

CREATE POLICY "Allow public insert" ON public.pipeline_prospec_minoru
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.pipeline_prospec_minoru
  FOR UPDATE USING (true);

CREATE POLICY "Allow public select" ON public.pipeline_prospec_minoru
  FOR SELECT USING (true);

-- Pipeline Marcos Rossi
DROP POLICY IF EXISTS "Authenticated users can view metrics" ON public.pipeline_prospec_marcos_rossi;
DROP POLICY IF EXISTS "Admins can insert metrics" ON public.pipeline_prospec_marcos_rossi;
DROP POLICY IF EXISTS "Admins can update metrics" ON public.pipeline_prospec_marcos_rossi;
DROP POLICY IF EXISTS "Admins can delete metrics" ON public.pipeline_prospec_marcos_rossi;
DROP POLICY IF EXISTS "Allow anon insert metrics" ON public.pipeline_prospec_marcos_rossi;
DROP POLICY IF EXISTS "Allow anon update metrics" ON public.pipeline_prospec_marcos_rossi;

CREATE POLICY "Allow public insert" ON public.pipeline_prospec_marcos_rossi
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.pipeline_prospec_marcos_rossi
  FOR UPDATE USING (true);

CREATE POLICY "Allow public select" ON public.pipeline_prospec_marcos_rossi
  FOR SELECT USING (true);

-- Pipeline BP Results
DROP POLICY IF EXISTS "Authenticated users can view metrics" ON public.pipeline_prospec_bp_results;
DROP POLICY IF EXISTS "Admins can insert metrics" ON public.pipeline_prospec_bp_results;
DROP POLICY IF EXISTS "Admins can update metrics" ON public.pipeline_prospec_bp_results;
DROP POLICY IF EXISTS "Admins can delete metrics" ON public.pipeline_prospec_bp_results;
DROP POLICY IF EXISTS "Allow anon insert metrics" ON public.pipeline_prospec_bp_results;
DROP POLICY IF EXISTS "Allow anon update metrics" ON public.pipeline_prospec_bp_results;

CREATE POLICY "Allow public insert" ON public.pipeline_prospec_bp_results
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.pipeline_prospec_bp_results
  FOR UPDATE USING (true);

CREATE POLICY "Allow public select" ON public.pipeline_prospec_bp_results
  FOR SELECT USING (true);