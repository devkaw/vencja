-- ============================================
-- MIGRAÇÃO: Dashboard completo (06/11/2026)
-- Execute no SQL Editor do Supabase antes de publicar a versão nova.
-- ============================================

-- 1. Preferência do aviso diário por e-mail
CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  daily_email BOOLEAN NOT NULL DEFAULT true,
  last_sent_on DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification settings" ON public.notification_settings;
CREATE POLICY "Users can view own notification settings" ON public.notification_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notification settings" ON public.notification_settings;
CREATE POLICY "Users can insert own notification settings" ON public.notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification settings" ON public.notification_settings;
CREATE POLICY "Users can update own notification settings" ON public.notification_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON public.notification_settings FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.notification_settings TO authenticated;
GRANT ALL ON public.notification_settings TO service_role;

-- 2. Limites do plano grátis garantidos no banco.
-- Mesma regra de hasPremiumAccess (src/lib/subscription.ts). Registros existentes
-- acima do limite continuam intactos: só novos inserts são bloqueados.
CREATE OR REPLACE FUNCTION public.enforce_plan_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tem_pro boolean;
  limite integer;
  total integer;
BEGIN
  -- O restante de um pagamento parcial é criado pela API com a service role.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Serializa inserts simultâneos do mesmo usuário.
  PERFORM pg_advisory_xact_lock(hashtext(TG_TABLE_NAME || NEW.user_id::text));

  SELECT plano = 'pro' AND (subscription_ends_at IS NULL OR subscription_ends_at >= now())
    INTO tem_pro
    FROM profiles
    WHERE id = NEW.user_id;

  IF COALESCE(tem_pro, false) THEN
    RETURN NEW;
  END IF;

  limite := CASE TG_TABLE_NAME WHEN 'clients' THEN 3 ELSE 10 END;
  EXECUTE format('SELECT count(*) FROM public.%I WHERE user_id = $1', TG_TABLE_NAME) INTO total USING NEW.user_id;

  IF total >= limite THEN
    RAISE EXCEPTION 'plan_limit' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_plan_limits() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS clients_plan_limit ON public.clients;
CREATE TRIGGER clients_plan_limit BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();

DROP TRIGGER IF EXISTS charges_plan_limit ON public.charges;
CREATE TRIGGER charges_plan_limit BEFORE INSERT ON public.charges
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();

-- 3. Limite de tentativas compartilhado entre as instâncias do servidor.
CREATE TABLE IF NOT EXISTS public.rate_limits (
  chave TEXT PRIMARY KEY,
  contagem INTEGER NOT NULL,
  reinicia_em TIMESTAMPTZ NOT NULL
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;
GRANT ALL ON public.rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consumir_limite(p_chave TEXT, p_maximo INTEGER, p_janela_segundos INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  atual INTEGER;
BEGIN
  INSERT INTO rate_limits AS r (chave, contagem, reinicia_em)
  VALUES (p_chave, 1, now() + make_interval(secs => p_janela_segundos))
  ON CONFLICT (chave) DO UPDATE SET
    contagem = CASE WHEN r.reinicia_em <= now() THEN 1 ELSE r.contagem + 1 END,
    reinicia_em = CASE WHEN r.reinicia_em <= now() THEN EXCLUDED.reinicia_em ELSE r.reinicia_em END
  RETURNING contagem INTO atual;

  DELETE FROM rate_limits WHERE reinicia_em < now() - interval '1 day';
  RETURN atual <= p_maximo;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.consumir_limite(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consumir_limite(TEXT, INTEGER, INTEGER) TO service_role;

-- 4. Tabela legada sem uso: estas políticas valiam para qualquer usuário logado, não só para a service role.
-- Só roda se a tabela existir: em bancos onde ela já foi removida, não há nada a fazer.
DO $$
BEGIN
  IF to_regclass('public.notifications') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Service role can update notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Service role can delete notifications" ON public.notifications;
  END IF;
END
$$;

-- 5. Limites de sanidade. NOT VALID não mexe em linhas antigas: só vale para o que for gravado daqui em diante.
ALTER TABLE public.charges DROP CONSTRAINT IF EXISTS charges_valor_positivo;
ALTER TABLE public.charges ADD CONSTRAINT charges_valor_positivo CHECK (valor > 0 AND valor <= 99999999.99) NOT VALID;
ALTER TABLE public.charges DROP CONSTRAINT IF EXISTS charges_descricao_tamanho;
ALTER TABLE public.charges ADD CONSTRAINT charges_descricao_tamanho CHECK (char_length(descricao) <= 500) NOT VALID;
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_campos_tamanho;
ALTER TABLE public.clients ADD CONSTRAINT clients_campos_tamanho CHECK (char_length(nome) <= 200 AND char_length(telefone) <= 30 AND char_length(email) <= 254) NOT VALID;
