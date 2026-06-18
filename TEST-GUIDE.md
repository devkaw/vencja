# Guia de Testes - Webhook VenceJa

## Pré-requisitos

1. **Variáveis de ambiente no Vercel:**
   ```
   CAKTO_WEBHOOK_SECRET=27bff7bad1b423338a057c9b779d011f95419e9e952fd7071811f3796aab6a1a
   ```

2. **Tabela criada no Supabase:**
   Execute o script `supabase/add-webhook-events.sql` no SQL Editor

3. **Webhook configurado na Cakto:**
   - URL: `https://venceja.com.br/api/webhooks/cakto`
   - Chave Secreta: mesma do Vercel
   - Eventos: todos os 8

---

## Como Testar (Sem Apagar Dados)

### Opção 1: Teste via Cakto (Recomendado)

1. Acesse o painel da Cakto
2. Vá em **Integrações → Webhooks**
3. Clique nos 3 pontinhos do webhook
4. Selecione **"Enviar evento de teste"**
5. Escolha o evento (ex: `purchase_approved`)
6. Verifique os logs no Vercel

**⚠️ Nota:** O teste da Cakto envia payload genérico. O webhook vai logar "Profile not found" pois o email é fake. Isso é esperado.

---

### Opção 2: Teste via SQL (Mais Completo)

Execute os scripts em `supabase/test-scenarios.sql` no SQL Editor do Supabase:

#### Cenário 1: Ativar Pro
```sql
-- Substitua 'seu@email.com' pelo seu email
UPDATE profiles 
SET 
  plano = 'pro',
  subscription_status = 'active',
  subscription_cycle = 'monthly',
  subscription_started_at = NOW(),
  subscription_ends_at = NOW() + INTERVAL '1 month',
  subscription_id = 'test_' || EXTRACT(EPOCH FROM NOW())::text
WHERE email = 'seu@email.com';
```

#### Cenário 2: Simular Cancelamento
```sql
UPDATE profiles 
SET 
  cancellation_status = 'pending',
  cancellation_type = 'cancel',
  cancellation_requested_at = NOW()
WHERE email = 'seu@email.com' AND plano = 'pro';
```

#### Cenário 3: Simular Reembolso
```sql
UPDATE profiles 
SET 
  cancellation_status = 'pending',
  cancellation_type = 'refund',
  cancellation_requested_at = NOW()
WHERE email = 'seu@email.com' AND plano = 'pro';
```

#### Cenário 4: Voltar ao Free
```sql
UPDATE profiles 
SET 
  plano = 'free',
  subscription_status = NULL,
  subscription_cycle = NULL,
  subscription_started_at = NULL,
  subscription_ends_at = NULL,
  subscription_id = NULL,
  cancellation_status = NULL,
  cancellation_type = NULL
WHERE email = 'seu@email.com';
```

---

### Opção 3: Teste via cURL (Avançado)

```bash
# Ativar Pro
curl -X POST https://venceja.com.br/api/webhooks/cakto \
  -H "Content-Type: application/json" \
  -d '{
    "event": "purchase_approved",
    "data": {
      "id": "test_123",
      "refId": "TEST123",
      "status": "paid",
      "customer": {
        "name": "Teste",
        "email": "seu@email.com"
      },
      "offer": {
        "id": "offer_123",
        "name": "Pro Mensal",
        "price": 49.90
      },
      "subscription": {
        "id": "sub_123",
        "status": "active"
      }
    }
  }'
```

---

## Verificação de Resultados

### 1. Logs no Vercel
- Acesse o dashboard do Vercel
- Vá em **Logs → Function Logs**
- Procure por `[Cakto Webhook]`
- Verifique se o evento foi processado

### 2. Banco de Dados
```sql
-- Verificar perfil do usuário
SELECT email, plano, subscription_status, subscription_ends_at 
FROM profiles 
WHERE email = 'seu@email.com';

-- Ver eventos processados
SELECT * FROM webhook_events 
ORDER BY created_at DESC 
LIMIT 10;
```

### 3. Email
Verifique sua caixa de entrada para os emails:
- Pagamento confirmado
- Assinatura cancelada
- Reembolso processado

---

## Cenários de Teste

| Cenário | Evento | Resultado Esperado |
|---------|--------|-------------------|
| Ativar Pro | `purchase_approved` | `plano = 'pro'`, email confirmado |
| Renovar | `subscription_renewed` | `subscription_ends_at` estendido |
| Pagamento falhou | `subscription_renewal_refused` | `subscription_status = 'past_due'` |
| Cancelar | `subscription_canceled` | `subscription_status = 'canceled'` (mantém acesso) |
| Reembolsar | `refund` | `plano = 'free'` |
| Chargeback | `chargeback` | `plano = 'free'` |
| Compra recusada | `purchase_refused` | Sem mudança, email de erro |

---

## Troubleshooting

### Erro "Profile not found"
- O email no webhook não corresponde a nenhum usuário
- Verifique se o email está correto no payload

### Erro "Invalid signature"
- A chave secreta não confere
- Verifique `CAKTO_WEBHOOK_SECRET` no Vercel

### Email não enviado
- Verifique as credenciais do Resend no Vercel
- Verifique os logs de envio de email

### Webhook não recebido
- Verifique se a URL está correta na Cakto
- Teste com o RequestBin primeiro
- Verifique se o endpoint está acessível
