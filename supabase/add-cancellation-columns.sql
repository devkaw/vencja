-- ============================================
-- MIGRAÇÃO: Adicionar colunas de cancelamento na profiles
-- ============================================
-- Execute apenas se add-subscriptions.sql já foi executado
-- e as colunas ainda não existem

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cancellation_status TEXT CHECK (cancellation_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS cancellation_type TEXT CHECK (cancellation_type IN ('cancel', 'refund')),
ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
