-- ============================================
-- LIMPEZA E ATUALIZAÇÃO DO BANCO - VENCEJA
-- Execute este SQL para limpar campos do Stripe e configurar o banco
-- ============================================

-- 1. DROP das tabelas existentes (se quiser recomeçar do zero)
-- ATENÇÃO: Isto apagará todos os dados!
-- Descomente as linhas abaixo apenas se quiser recriar o banco:

-- DROP TABLE IF EXISTS payment_requests CASCADE;
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS charges CASCADE;
-- DROP TABLE IF EXISTS clients CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- SE PRECISAR REMOVER APENAS OS CAMPOS STRIPE:
-- ============================================

-- 2. Remover campos do Stripe da tabela profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS stripe_subscription_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS data_expiracao_plano;

-- 3. Adicionar novos campos se não existirem
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS acesso_vitalicio BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status_pagamento TEXT DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'aprovado', 'rejeitado'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- ============================================
-- CRIAR TABELA DE SOLICITAÇÕES DE PAGAMENTO
-- ============================================

CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  comprovante_url TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POLÍTICAS RLS PARA payment_requests
-- ============================================

-- Habilitar RLS
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias solicitações
DROP POLICY IF EXISTS "Users can view own payment requests" ON payment_requests;
CREATE POLICY "Users can view own payment requests" ON payment_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem criar solicitações
DROP POLICY IF EXISTS "Users can insert own payment requests" ON payment_requests;
CREATE POLICY "Users can insert own payment requests" ON payment_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias solicitações
DROP POLICY IF EXISTS "Users can update own payment requests" ON payment_requests;
CREATE POLICY "Users can update own payment requests" ON payment_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins podem ver todas as solicitações
DROP POLICY IF EXISTS "Admins can view all payment requests" ON payment_requests;
CREATE POLICY "Admins can view all payment requests" ON payment_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Admins podem atualizar todas as solicitações
DROP POLICY IF EXISTS "Admins can update all payment requests" ON payment_requests;
CREATE POLICY "Admins can update all payment requests" ON payment_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);

-- ============================================
-- FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para payment_requests
DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON payment_requests;
CREATE TRIGGER update_payment_requests_updated_at
  BEFORE UPDATE ON payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- POLÍTICAS DE STORAGE PARA COMPETENTES
-- ============================================

-- Limpar políticas existentes do bucket comprovantes
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner reads" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own comprovantes" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload comprovantes" ON storage.objects;

-- Criar políticas para bucket comprovantes
-- Primeiro, crie o bucket "comprovantes" manualmente no Supabase > Storage

-- Permitir upload para usuários autenticados (apenas no bucket comprovantes)
CREATE POLICY "Allow authenticated uploads_comprovantes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'comprovantes' 
    AND auth.role() = 'authenticated'
  );

-- Permitir que usuários vejam seus próprios arquivos
CREATE POLICY "Allow owner reads_comprovantes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'comprovantes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Permitir que admins vejam todos os arquivos
CREATE POLICY "Allow admin reads_comprovantes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'comprovantes' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid()::uuid 
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- CONFIGURAR ADMIN (MUDE O EMAIL!)
-- ============================================

-- Substitua 'SEU_EMAIL@AQUI.COM' pelo seu email!
UPDATE profiles
SET is_admin = true
WHERE email = 'SEU_EMAIL@AQUI.COM';

-- Se o email não existir ainda, você pode procurar pelo ID:
-- UPDATE profiles
-- SET is_admin = true
-- WHERE id = 'SEU_UUID_AQUI';

-- ============================================
-- VERIFICAR RESULTADO
-- ============================================

-- Ver estrutura da tabela profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Verificar se admin foi configurado
SELECT id, email, plano, acesso_vitalicio, is_admin 
FROM profiles 
WHERE is_admin = true;
