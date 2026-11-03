-- ============================================
-- MIGRAÇÃO: Endurecimento de segurança e integridade (auditoria 03/11/2026)
-- Aplicada em produção em 03/11/2026 (SQL Editor do Supabase).
-- ============================================

-- 1. PROFILES: remover policies "admin" abertas para qualquer usuário logado
DROP POLICY IF EXISTS "Admin can view all" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own subscription fields" ON public.profiles;

-- Usuário não altera o próprio perfil pelo client (plano/assinatura só via service_role).
-- INSERT só das colunas básicas (o trigger handle_new_user já cria o perfil).
REVOKE UPDATE, DELETE ON public.profiles FROM anon, authenticated;
REVOKE INSERT ON public.profiles FROM anon, authenticated;
GRANT INSERT (id, email) ON public.profiles TO authenticated;

-- 2. AUTH_TOKENS: acessível apenas pelo service_role
DROP POLICY IF EXISTS "Anyone can insert auth tokens" ON public.auth_tokens;
DROP POLICY IF EXISTS "Anyone can select by token" ON public.auth_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON public.auth_tokens;
REVOKE ALL ON public.auth_tokens FROM anon, authenticated;

-- 3. WEBHOOK_EVENTS: acessível apenas pelo service_role
DROP POLICY IF EXISTS "Service role full access" ON public.webhook_events;
REVOKE ALL ON public.webhook_events FROM anon, authenticated;

-- 4. SUBSCRIPTIONS: usuário só lê; escrita só via webhook (service_role)
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.subscriptions;
REVOKE INSERT, UPDATE, DELETE ON public.subscriptions FROM anon, authenticated;

-- 5. Privilégios que não deveriam existir para roles da API
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- 6. STORAGE: bucket legado de comprovantes deixa de ser público
UPDATE storage.buckets SET public = false WHERE id = 'comprovantes';
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem upload de comprovantes" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem ver próprios comprovantes" ON storage.objects;

-- 7. FUNÇÕES: search_path fixo e trigger não executável via RPC
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, lower(new.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.update_subscription_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at() SET search_path = public;

-- 8. CHARGES: aceitar periodicidade quinzenal (oferecida na UI)
ALTER TABLE public.charges DROP CONSTRAINT IF EXISTS charges_periodicidade_check;
ALTER TABLE public.charges ADD CONSTRAINT charges_periodicidade_check
  CHECK (periodicidade IN ('semanal', 'quinzenal', 'mensal'));
CREATE INDEX IF NOT EXISTS idx_charges_charge_original_id ON public.charges(charge_original_id);
