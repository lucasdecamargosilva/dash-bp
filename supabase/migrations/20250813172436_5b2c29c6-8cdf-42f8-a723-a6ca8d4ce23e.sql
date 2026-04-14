-- Zerar todos os dados mensais dos players, mantendo apenas os clientes
-- Remove todos os canais de aquisição
DELETE FROM public.channels;

-- Remove todos os dados mensais
DELETE FROM public.monthly_data;

-- Os clientes (players) permanecem na tabela clients