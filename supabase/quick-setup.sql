-- ============================================
-- SCRIPT RÁPIDO DE CONFIGURAÇÃO - VENCEJA
-- Execute no Supabase > SQL Editor
-- ============================================

-- 1. REMOVER CAMPOS STRIPE (se existirem)
ALTER TABLE profiles DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS stripe_subscription_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS data_expiracao_plano;

-- 2. ADICIONAR NOVOS CAMPOS
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS acesso_vitalicio BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status_pagamento TEXT DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'aprovado', 'rejeitado'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 3. CRIAR TABELA DE PAGAMENTOS
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  comprovante_url TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. POLÍTICAS RLS PARA payment_requests
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own" ON payment_requests;
CREATE POLICY "Users view own" ON payment_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own" ON payment_requests;
CREATE POLICY "Users insert own" ON payment_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own" ON payment_requests;
CREATE POLICY "Users update own" ON payment_requests
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all" ON payment_requests;
CREATE POLICY "Admins view all" ON payment_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Admins update all" ON payment_requests;
CREATE POLICY "Admins update all" ON payment_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 5. FUNÇÃO auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_requests_update_ts ON payment_requests;
CREATE TRIGGER payment_requests_update_ts
  BEFORE UPDATE ON payment_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_payment_req_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_req_user ON payment_requests(user_id);

-- ============================================
-- ⚠️ ANTES DE EXECUTAR, MUDE O EMAIL ABAIXO!
-- ============================================

-- 7. CONFIGURAR ADMIN (COLOQUE SEU EMAIL AQUI!)
-- Descomente e execute após cadastrar sua conta

-- UPDATE profiles
-- SET is_admin = true
-- WHERE email = 'seu-email@dominio.com';

-- ============================================
-- VERIFICAR CONFIGURAÇÃO
-- ============================================

-- Verificar colunas da tabela profiles
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Ver se payment_requests foi criada
SELECT * FROM payment_requests LIMIT 1;
