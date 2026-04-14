-- Adicionar política de DELETE para todas as tabelas de pipeline
CREATE POLICY "Permitir exclusão pública de métricas" 
ON public.pipeline_prospec_bp_results 
FOR DELETE 
USING (true);

CREATE POLICY "Permitir exclusão pública de métricas" 
ON public.pipeline_prospec_elyano 
FOR DELETE 
USING (true);

CREATE POLICY "Permitir exclusão pública de métricas" 
ON public.pipeline_prospec_marcos_rossi 
FOR DELETE 
USING (true);

CREATE POLICY "Permitir exclusão pública de métricas" 
ON public.pipeline_prospec_minoru 
FOR DELETE 
USING (true);