-- ============================================
-- SCRIPTS DE TESTE - CENÁRIOS PRO
-- ============================================
-- Execute estes scripts no Supabase SQL Editor
-- para testar sem apagar dados reais

-- ============================================
-- 1. SIMULAR USUÁRIO PRO (ativação)
-- ============================================
-- Substitua 'SEU_EMAIL_AQUI' pelo seu email real

-- Verificar seu perfil atual
SELECT id, email, plano, subscription_status, subscription_ends_at 
FROM profiles 
WHERE email = 'SEU_EMAIL_AQUI';

-- Ativar plano Pro para teste (mantém dados existentes)
UPDATE profiles 
SET 
  plano = 'pro',
  subscription_status = 'active',
  subscription_cycle = 'monthly',
  subscription_started_at = NOW(),
  subscription_ends_at = NOW() + INTERVAL '1 month',
  subscription_id = 'test_subscription_' || EXTRACT(EPOCH FROM NOW())::text
WHERE email = 'SEU_EMAIL_AQUI';

-- ============================================
-- 2. SIMULAR CANCELAMENTO PENDENTE
-- ============================================

-- Criar solicitação de cancelamento
UPDATE profiles 
SET 
  cancellation_status = 'pending',
  cancellation_type = 'cancel',
  cancellation_requested_at = NOW(),
  cancellation_reason = 'Teste de cancelamento'
WHERE email = 'SEU_EMAIL_AQUI' AND plano = 'pro';

-- Verificar status
SELECT email, plano, cancellation_status, cancellation_type, 
       cancellation_requested_at, subscription_ends_at
FROM profiles 
WHERE email = 'SEU_EMAIL_AQUI';

-- ============================================
-- 3. SIMULAR REEMBOLSO PENDENTE
-- ============================================

-- Criar solicitação de reembolso
UPDATE profiles 
SET 
  cancellation_status = 'pending',
  cancellation_type = 'refund',
  cancellation_requested_at = NOW(),
  cancellation_reason = 'Teste de reembolso'
WHERE email = 'SEU_EMAIL_AQUI' AND plano = 'pro';

-- ============================================
-- 4. SIMULAR ASSINATURA CANCELADA (com acesso)
-- ============================================

-- Cancelar mas manter acesso até fim do período
UPDATE profiles 
SET 
  subscription_status = 'canceled',
  cancellation_status = 'approved',
  cancellation_requested_at = NULL,
  cancellation_type = NULL,
  cancellation_reason = NULL
WHERE email = 'SEU_EMAIL_AQUI' AND plano = 'pro';

-- ============================================
-- 5. SIMULAR ASSINATURA EXPIRADA (sem acesso)
-- ============================================

-- Reverter para plano gratuito
UPDATE profiles 
SET 
  plano = 'free',
  subscription_status = 'canceled',
  cancellation_status = 'approved',
  subscription_id = NULL,
  subscription_started_at = NULL,
  subscription_ends_at = NULL,
  subscription_cycle = NULL
WHERE email = 'SEU_EMAIL_AQUI';

-- ============================================
-- 6. SIMULAR PAGAMENTO ATRASADO (past_due)
-- ============================================

UPDATE profiles 
SET 
  subscription_status = 'past_due'
WHERE email = 'SEU_EMAIL_AQUI' AND plano = 'pro';

-- ============================================
-- 7. VERIFICAR HISTÓRICO DE WEBHOOKS
-- ============================================

-- Ver eventos processados
SELECT event_key, event_type, order_id, processed_at 
FROM webhook_events 
ORDER BY created_at DESC 
LIMIT 10;

-- ============================================
-- 8. LIMPAR DADOS DE TESTE
-- ============================================

-- Voltar ao estado original (free)
UPDATE profiles 
SET 
  plano = 'free',
  subscription_status = NULL,
  subscription_cycle = NULL,
  subscription_started_at = NULL,
  subscription_ends_at = NULL,
  subscription_id = NULL,
  cancellation_status = NULL,
  cancellation_type = NULL,
  cancellation_requested_at = NULL,
  cancellation_reason = NULL
WHERE email = 'SEU_EMAIL_AQUI';

-- Limpar eventos de teste
DELETE FROM webhook_events WHERE event_key LIKE 'test_%';
