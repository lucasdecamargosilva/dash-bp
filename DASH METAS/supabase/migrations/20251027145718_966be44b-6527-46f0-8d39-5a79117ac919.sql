-- Create table for pipeline goals
CREATE TABLE public.pipeline_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name text NOT NULL UNIQUE,
  total_mensagens_enviadas integer NOT NULL DEFAULT 0,
  total_conexoes integer NOT NULL DEFAULT 0,
  total_whatsapp_obtido integer NOT NULL DEFAULT 0,
  total_reunioes_agendadas integer NOT NULL DEFAULT 0,
  total_reunioes_realizadas integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pipeline_goals ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view goals
CREATE POLICY "Authenticated users can view goals"
ON public.pipeline_goals
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Admins can insert goals
CREATE POLICY "Admins can insert goals"
ON public.pipeline_goals
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update goals
CREATE POLICY "Admins can update goals"
ON public.pipeline_goals
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete goals
CREATE POLICY "Admins can delete goals"
ON public.pipeline_goals
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_pipeline_goals_updated_at
BEFORE UPDATE ON public.pipeline_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default goals for existing clients
INSERT INTO public.pipeline_goals (client_name, total_mensagens_enviadas, total_conexoes, total_whatsapp_obtido, total_reunioes_agendadas, total_reunioes_realizadas)
VALUES 
  ('Minoru', 1000, 100, 50, 20, 10),
  ('Elyano', 1000, 100, 50, 20, 10),
  ('Marcos Rossi', 1000, 100, 50, 20, 10),
  ('BP Results', 1000, 100, 50, 20, 10)
ON CONFLICT (client_name) DO NOTHING;