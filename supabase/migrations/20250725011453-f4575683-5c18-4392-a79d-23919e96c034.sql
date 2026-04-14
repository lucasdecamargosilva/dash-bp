-- Add unique constraint for client_id and month combination to prevent duplicate entries
-- This ensures that each client can have only one revenue entry per month

-- First, let's check if the constraint already exists
DO $$
BEGIN
    -- Create unique constraint on client_id and month if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'monthly_data_client_month_unique'
    ) THEN
        ALTER TABLE public.monthly_data 
        ADD CONSTRAINT monthly_data_client_month_unique 
        UNIQUE (client_id, month);
    END IF;
END $$;