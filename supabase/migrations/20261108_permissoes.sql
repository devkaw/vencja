-- ============================================
-- MIGRAÇÃO: Permissões mínimas (08/11/2026)
-- Execute no SQL Editor do Supabase. Pode rodar mais de uma vez.
-- ============================================

-- 1. Visitante sem login (anon) não precisa de nenhuma tabela de dados.
-- Hoje o RLS já bloqueia as linhas; isto tira também a permissão, como segunda barreira.
REVOKE ALL ON public.charges, public.clients, public.payments, public.profiles, public.subscriptions FROM anon;

-- 2. Preferência de aviso: o usuário só lê, cria e altera a própria linha.
-- DELETE e TRUNCATE ficavam liberados pelos privilégios padrão; TRUNCATE ignora o RLS
-- e apagaria a escolha de quem pediu para não receber e-mail.
REVOKE ALL ON public.notification_settings FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notification_settings TO authenticated;
GRANT ALL ON public.notification_settings TO service_role;
