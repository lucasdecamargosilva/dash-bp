-- Create unique constraint to prevent duplicates per client/channel/month
-- This will ensure upsert works correctly and prevents duplicate channels
-- First, clean up any existing duplicates by keeping only the latest record per group

-- Delete duplicates keeping only the most recent record per client_id + name + month combination
DELETE FROM public.channels
WHERE id NOT IN (
  SELECT DISTINCT ON (client_id, name, month) id
  FROM public.channels
  ORDER BY client_id, name, month, created_at DESC
);

-- Create unique constraint to prevent future duplicates
ALTER TABLE public.channels
ADD CONSTRAINT channels_client_name_month_unique 
UNIQUE (client_id, name, month);