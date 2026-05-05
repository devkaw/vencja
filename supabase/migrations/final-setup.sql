-- ============================================
-- MIGRAÇÃO FINAL - VENCEJA
-- Execute este arquivo no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CAMPOS DE ASSINATURA (se ainda não executou add-subscriptions.sql)
-- ============================================

-- Adicionar campos na tabela profiles (ignora se já existir)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
ADD COLUMN IF NOT EXISTS subscription_cycle TEXT CHECK (subscription_cycle IN ('monthly', 'annual')),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_type TEXT,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_status TEXT CHECK (cancellation_status IN ('pending', 'approved', 'rejected'));

-- Criar tabela de subscriptions (ignora se já existir)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_id TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  price_cents INTEGER NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscription_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription_id ON subscriptions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_id ON profiles(subscription_id);

-- Habilitar RLS na subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON subscriptions;

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- ============================================
-- 2. POLÍTICAS RLS PARA NOVOS CAMPOS
-- ============================================

-- Permitir que usuários leiam seus próprios dados de assinatura
DROP POLICY IF EXISTS "Users can view own subscription fields" ON profiles;
CREATE POLICY "Users can view own subscription fields" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

SELECT 
  'profiles' as table_name,
  column_name,
  data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('plano', 'subscription_id', 'subscription_status', 'subscription_cycle', 'cancellation_status')
ORDER BY column_name;

SELECT 
  'subscriptions' as table_name,
  COUNT(*) as exists
FROM information_schema.tables 
WHERE table_name = 'subscriptions';