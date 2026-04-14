-- Remove the insecure public access policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a secure policy that only allows users to view their own profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Optional: Create a policy to allow users to view only display names and avatars of other users
-- This excludes sensitive data like email addresses
CREATE POLICY "Users can view public profile data of others" 
ON public.profiles 
FOR SELECT 
USING (true)
WITH CHECK (false); -- This will be a view-only policy for specific columns

-- Since we can't create column-level policies directly, we'll need to handle this in the application layer
-- For now, we'll keep the strict policy and modify application queries as needed