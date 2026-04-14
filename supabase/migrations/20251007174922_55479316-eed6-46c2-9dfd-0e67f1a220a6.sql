-- Update the is_authorized_user function to include adm@bpgroupbr.com.br
CREATE OR REPLACE FUNCTION public.is_authorized_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
      AND email IN ('raphaelacioli@bpgroupbr.com.br', 'lucasdecamargo2015@gmail.com', 'adm@bpgroupbr.com.br')
  );
$function$;