-- Add DELETE policies to pipeline tables

-- Pipeline Elyano
CREATE POLICY "Allow public delete" 
ON pipeline_prospec_elyano 
FOR DELETE 
USING (true);

-- Pipeline Marcos Rossi
CREATE POLICY "Allow public delete" 
ON pipeline_prospec_marcos_rossi 
FOR DELETE 
USING (true);

-- Pipeline Minoru
CREATE POLICY "Allow public delete" 
ON pipeline_prospec_minoru 
FOR DELETE 
USING (true);

-- Pipeline BP Results
CREATE POLICY "Allow public delete" 
ON pipeline_prospec_bp_results 
FOR DELETE 
USING (true);