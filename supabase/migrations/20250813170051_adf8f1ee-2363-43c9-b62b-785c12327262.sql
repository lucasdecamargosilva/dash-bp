-- Clear all channel data
DELETE FROM public.channels;

-- Clear all monthly data
DELETE FROM public.monthly_data;

-- Keep clients table intact (no changes needed)