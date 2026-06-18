#!/bin/bash

# ============================================
# SCRIPT DE TESTE - WEBHOOK VENCEJA
# ============================================
# Este script testa todos os cenários do webhook
# sem apagar dados reais. Use em ambiente de teste.

APP_URL="${NEXT_PUBLIC_APP_URL:-https://venceja.com.br}"
WEBHOOK_URL="$APP_URL/api/webhooks/cakto"

echo "=========================================="
echo "  TESTE DO WEBHOOK VENCEJA"
echo "=========================================="
echo ""
echo "URL: $WEBHOOK_URL"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_event() {
  local event=$1
  local description=$2
  local email=$3
  
  echo -e "${YELLOW}Testando: $description${NC}"
  echo "Evento: $event"
  
  if [ -n "$email" ]; then
    echo "Email: $email"
  fi
  
  response=$(curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -d "{
      \"event\": \"$event\",
      \"data\": {
        \"id\": \"test_$(date +%s)\",
        \"refId\": \"TEST$(openssl rand -hex 4 | tr '[:lower:]' '[:upper:]')\",
        \"status\": \"paid\",
        \"customer\": {
          \"name\": \"Usuário Teste\",
          \"email\": \"${email:-teste@venceja.com.br}\"
        },
        \"offer\": {
          \"id\": \"test_offer\",
          \"name\": \"Pro Mensal\",
          \"price\": 49.90
        },
        \"product\": {
          \"id\": \"test_product\",
          \"name\": \"VenceJa Pro\",
          \"type\": \"subscription\"
        },
        \"subscription\": {
          \"id\": \"test_sub_$(date +%s)\",
          \"status\": \"active\"
        },
        \"amount\": 49.90
      }
    }")
  
  echo "Resposta: $response"
  echo ""
}

# Verificar se tem variáveis de ambiente necessárias
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}ERRO: Variável SUPABASE_SERVICE_ROLE_KEY não definida${NC}"
  echo "Defina: export SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui"
  exit 1
fi

echo "=========================================="
echo "  1. TESTE DE ATIVAÇÃO (purchase_approved)"
echo "=========================================="
test_event "purchase_approved" "Ativar plano Pro" "usuario_teste@email.com"

echo "=========================================="
echo "  2. TESTE DE RENOVAÇÃO (subscription_renewed)"
echo "=========================================="
test_event "subscription_renewed" "Renovar assinatura" "usuario_teste@email.com"

echo "=========================================="
echo "  3. TESTE DE PAGAMENTO REJEITADO"
echo "=========================================="
test_event "subscription_renewal_refused" "Pagamento rejeitado" "usuario_teste@email.com"

echo "=========================================="
echo "  4. TESTE DE CANCELAMENTO"
echo "=========================================="
test_event "subscription_canceled" "Cancelar assinatura" "usuario_teste@email.com"

echo "=========================================="
echo "  5. TESTE DE REEMBOLSO"
echo "=========================================="
test_event "refund" "Reembolsar assinatura" "usuario_teste@email.com"

echo "=========================================="
echo "  6. TESTE DE CHARGEBACK"
echo "=========================================="
test_event "chargeback" "Chargeback" "usuario_teste@email.com"

echo "=========================================="
echo "  7. TESTE DE COMPRA RECUSADA"
echo "=========================================="
test_event "purchase_refused" "Compra recusada" "usuario_teste@email.com"

echo "=========================================="
echo "  TESTES CONCLUÍDOS"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo "1. Verifique os logs no Vercel"
echo "2. Verifique o banco de dados no Supabase"
echo "3. Verifique os emails enviados"
echo ""
