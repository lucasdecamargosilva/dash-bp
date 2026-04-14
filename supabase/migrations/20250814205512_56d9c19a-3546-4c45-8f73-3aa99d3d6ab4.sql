-- Add missing columns to clients table to support full client functionality
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS responsible TEXT,
ADD COLUMN IF NOT EXISTS project_type TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies to allow authenticated users to create their own clients
CREATE POLICY "Authenticated users can create clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Add policy for users to see all clients (since this is a dashboard where users should see all data)
DROP POLICY IF EXISTS "Anyone can view clients" ON public.clients;
CREATE POLICY "Authenticated users can view all clients" 
ON public.clients 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Add policy for users to update clients
CREATE POLICY "Authenticated users can update all clients" 
ON public.clients 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);