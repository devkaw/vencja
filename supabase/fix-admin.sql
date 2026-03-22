-- Execute este SQL no Supabase para:
-- 1. Adicionar campos que faltam na tabela profiles
-- 2. Configurar você como admin

-- 1. Adicionar novos campos (se não existirem)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS acesso_vitalicio BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status_pagamento TEXT DEFAULT 'pendente';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Configurar ADMIN - MUDE O EMAIL ABAIXO!
UPDATE profiles
SET is_admin = true
WHERE email = 'SEU_EMAIL_AQUI@xxx.com';

-- 3. Verificar se deu certo
SELECT id, email, plano, acesso_vitalicio, is_admin 
FROM profiles;
