-- ============================================
-- TABELA DE EVENTOS DO WEBHOOK (DEDUPLICAÇÃO)
-- ============================================

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  order_id TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_key ON webhook_events(event_key);
CREATE INDEX IF NOT EXISTS idx_webhook_events_order_id ON webhook_events(order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Habilitar RLS (service_role bypassa automaticamente)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Service role tem acesso total (webhook roda via service_role)
CREATE POLICY "Service role full access" ON webhook_events
  FOR ALL USING (true)
  WITH CHECK (true);

-- Limpar eventos antigos (mais de 30 dias)
-- Executar periodicamente via cron ou pg_cron
-- DELETE FROM webhook_events WHERE created_at < NOW() - INTERVAL '30 days';
