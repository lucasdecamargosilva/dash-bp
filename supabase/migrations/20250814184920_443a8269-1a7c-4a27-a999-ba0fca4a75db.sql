-- Enable RLS and create policies for the new tables

-- Enable RLS on all three tables
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acquisition_channel_metrics ENABLE ROW LEVEL SECURITY;

-- Channels policies (public read, authenticated write)
CREATE POLICY "Anyone can view channels" ON public.channels
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert channels" ON public.channels
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update channels" ON public.channels
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Clients policies (public read, authenticated write)
CREATE POLICY "Anyone can view clients" ON public.clients
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update clients" ON public.clients
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Acquisition metrics policies (public read, authenticated write)
CREATE POLICY "Anyone can view acquisition metrics" ON public.acquisition_channel_metrics
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert acquisition metrics" ON public.acquisition_channel_metrics
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update acquisition metrics" ON public.acquisition_channel_metrics
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete acquisition metrics" ON public.acquisition_channel_metrics
  FOR DELETE USING (auth.uid() IS NOT NULL);