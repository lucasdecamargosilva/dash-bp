-- Gestao de acessos pelo proprio painel.
--
-- Criar usuario e trocar senha de outra pessoa exigem privilegio de admin.
-- Fazer isso pelo frontend obrigaria a levar a service_role para o navegador,
-- onde qualquer um leria. Entao a operacao mora aqui: SECURITY DEFINER roda com
-- privilegio do dono da funcao, e a permissao e conferida por dentro — so quem
-- esta logado E e head no painel passa.

CREATE OR REPLACE FUNCTION panel_is_head()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth, extensions AS $$
  SELECT EXISTS (
    SELECT 1 FROM panel_members
    WHERE profile_id = auth.uid() AND is_head
  );
$$;

-- Cria o acesso e ja amarra na pessoa do painel.
CREATE OR REPLACE FUNCTION panel_criar_acesso(p_member_id UUID, p_email TEXT, p_senha TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions AS $$
DECLARE novo UUID; email_limpo TEXT;
BEGIN
  IF NOT panel_is_head() THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Só um head pode criar acessos.');
  END IF;
  IF length(coalesce(p_senha,'')) < 8 THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'A senha precisa de ao menos 8 caracteres.');
  END IF;

  email_limpo := lower(trim(p_email));
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = email_limpo) THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Já existe uma conta com esse e-mail.');
  END IF;

  novo := gen_random_uuid();
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', novo, 'authenticated', 'authenticated',
    email_limpo, crypt(p_senha, gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb
  );

  -- sem a identity o GoTrue nao reconhece o login por e-mail
  -- email aqui e coluna gerada a partir do identity_data; nao se insere direto
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
  VALUES (gen_random_uuid(), novo, novo::text,
          jsonb_build_object('sub', novo::text, 'email', email_limpo, 'email_verified', true),
          'email', now(), now());

  UPDATE panel_members SET profile_id = novo WHERE id = p_member_id;
  RETURN jsonb_build_object('ok', true, 'user_id', novo);
END;
$$;

-- Redefine a senha de alguem do time.
CREATE OR REPLACE FUNCTION panel_redefinir_senha(p_member_id UUID, p_senha TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions AS $$
DECLARE alvo UUID;
BEGIN
  IF NOT panel_is_head() THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Só um head pode redefinir senha.');
  END IF;
  IF length(coalesce(p_senha,'')) < 8 THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'A senha precisa de ao menos 8 caracteres.');
  END IF;

  SELECT profile_id INTO alvo FROM panel_members WHERE id = p_member_id;
  IF alvo IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Essa pessoa ainda não tem acesso criado.');
  END IF;

  UPDATE auth.users
     SET encrypted_password = crypt(p_senha, gen_salt('bf')), updated_at = now()
   WHERE id = alvo;
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Quem entra com qual e-mail — o painel precisa mostrar isso na tela.
CREATE OR REPLACE FUNCTION panel_acessos()
RETURNS TABLE (member_id UUID, email TEXT, ultimo_acesso TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth, extensions AS $$
  SELECT m.id, u.email::text, u.last_sign_in_at
  FROM panel_members m JOIN auth.users u ON u.id = m.profile_id
  WHERE panel_is_head();
$$;

REVOKE ALL ON FUNCTION panel_criar_acesso(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION panel_redefinir_senha(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION panel_criar_acesso(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION panel_redefinir_senha(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION panel_acessos() TO authenticated;
GRANT EXECUTE ON FUNCTION panel_is_head() TO authenticated, anon;
