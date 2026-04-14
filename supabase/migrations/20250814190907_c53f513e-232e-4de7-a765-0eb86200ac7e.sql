-- Remove all mock data from the database
-- This will clear all existing data but keep the table structure

-- Delete all acquisition channel metrics first (if any)
DELETE FROM acquisition_channel_metrics;

-- Delete all monthly data (if any)  
DELETE FROM monthly_data;

-- Delete all channels
DELETE FROM channels;

-- Delete all clients
DELETE FROM clients;

-- Note: We're keeping profiles table as it may contain real user data from authentication
-- If you want to delete profiles as well, uncomment the line below:
-- DELETE FROM profiles WHERE email NOT IN (SELECT email FROM auth.users);

-- Reset any sequences to start from 1 again (if needed)
-- This ensures that future auto-generated IDs start fresh
SELECT setval(pg_get_serial_sequence('clients', 'id'), 1, false) WHERE EXISTS (SELECT 1 FROM pg_class WHERE relname = 'clients_id_seq');
SELECT setval(pg_get_serial_sequence('channels', 'id'), 1, false) WHERE EXISTS (SELECT 1 FROM pg_class WHERE relname = 'channels_id_seq');

-- Verify the cleanup
SELECT 'clients' as table_name, COUNT(*) as remaining_records FROM clients
UNION ALL
SELECT 'channels' as table_name, COUNT(*) as remaining_records FROM channels
UNION ALL
SELECT 'acquisition_channel_metrics' as table_name, COUNT(*) as remaining_records FROM acquisition_channel_metrics
UNION ALL
SELECT 'monthly_data' as table_name, COUNT(*) as remaining_records FROM monthly_data;