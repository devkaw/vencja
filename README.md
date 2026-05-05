# VenceJa - Gestão Inteligente de Cobranças

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)
![Supabase](https://img.shields.io/badge/Supabase-2.47-3ECF8E)
![Status](https://img.shields.io/badge/Status-Produção-green)

## 📋 Descrição

O **VenceJa** é um SaaS completo de gestão de cobranças para pequenos negócios e profissionais autônomos no Brasil. Acompanhe quem te deve, receba via PIX/gateway e tome decisões baseadas em dados.

### Principais Funcionalidades

- **Dashboard Inteligente** - Métricas em tempo real: faturamento, inadimplência, média de atraso
- **Gestão de Clientes** - Cadastro completo com Score (0-100) calculado automaticamente
- **Cobranças Flexíveis** - Avulsas ou recorrentes (semanal/mensal)
- **Cobrança via WhatsApp** - Gera mensagem automática para enviar ao cliente
- **Ranking de Inadimplência** - Identifique rapidamente quem mais deve
- **Calendário Financeiro** - Visualize todas as datas de vencimento
- **Relatórios** - Faturamento mensal, gráficos de evolução
- **Exportação CSV** - Faça backup ou análise externa
- **Assinatura Mensal ou Anual** - Plano Pro com acesso ilimitado
- **Sistema de Cancelamento** - Usuário pode cancelar ou solicitar reembolso (7 dias)

## 🚀 Tecnologias

- **Frontend**: Next.js 16 com App Router, React 19, TypeScript
- **Estilização**: Tailwind CSS com design system customizado
- **Backend**: API Routes do Next.js
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Pagamentos**: Cakto (gateway brasileiro de assinaturas)
- **Emails**: Resend
- **Monitoramento**: Sentry
- **Analytics**: Vercel Analytics
- **Deploy**: Vercel (pronto)

## 📁 Estrutura do Projeto

```
venceja/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login, register, password reset
│   │   ├── api/                 # API routes
│   │   │   ├── auth/           # Autenticação
│   │   │   ├── subscriptions/ # Pagamentos Cakto
│   │   │   └── webhooks/       # Webhooks Cakto
│   │   ├── dashboard/          # Painel do usuário
│   │   │   ├── page.tsx        # Dashboard principal
│   │   │   ├── clients/        # Gestão de clientes
│   │   │   ├── charges/        # Gestão de cobranças
│   │   │   ├── calendar/       # Calendário financeiro
│   │   │   ├── ranking/        # Ranking inadimplência
│   │   │   ├── relatorios/     # Relatórios
│   │   │   ├── upgrade/        # Upgrade para Pro
│   │   │   └── settings/       # Configurações
│   │   └── page.tsx            # Landing page
│   ├── components/
│   │   ├── ui/                  # Design system
│   │   ├── layout/             # Sidebar, etc.
│   │   └── payment-form.tsx    # Formulário de pagamento
│   ├── lib/
│   │   ├── supabase/           # Cliente Supabase
│   │   ├── subscription.ts     # Lógica de acesso
│   │   ├── cakto/              # Integração Cakto
│   │   └── email/              # Envio de emails
│   ├── types/                  # TypeScript definitions
│   └── emails/                 # Templates de email
├── supabase/
│   ├── schema.sql              # Schema principal
│   ├── add-subscriptions.sql   # Migração assinaturas
│   └── migrations/             # Migrações adicionais
├── SETUP.md                    # Guia completo
└── package.json
```

## ⚡ Quick Start

### 1. Clonar o Repositório

```bash
git clone https://github.com/devkaw/vencja-main.git
cd vencja-main
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

```bash
cp .env.example .env.local
```

Preencha com suas credenciais:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend (Email)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@seudominio.com.br

# Cakto (Pagamentos)
CAKTO_CLIENT_ID=xxx
CAKTO_CLIENT_SECRET=xxx
CAKTO_OFFER_MONTHLY_ID=xxx
CAKTO_OFFER_ANNUAL_ID=xxx

# Admin
ADMIN_EMAIL=seu-email@seudominio.com.br
```

### 4. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Execute `supabase/schema.sql` no SQL Editor
3. Execute `supabase/add-subscriptions.sql`
4. Execute `supabase/migrations/final-setup.sql`

### 5. Executar Localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🌐 Deploy na Vercel

### 1. Preparar Repositório Git

```bash
git add .
git commit -m "Deploy inicial - VenceJa"
git push -u origin main
```

### 2. Deploy

1. Acesse [vercel.com](https://vercel.com)
2. Importe o repositório GitHub
3. Configure as Environment Variables
4. Deploy!

## 💳 Sistema de Pagamento

### Planos

| Recurso | Free | Pro |
|---------|------|-----|
| Clientes | 3 | Ilimitados |
| Cobranças | 10/mês | Ilimitadas |
| Dashboard | Básico | Completo |
| Score de clientes | ✅ | ✅ |
| Ranking inadimplência | ✅ | ✅ |
| Calendário | ✅ | ✅ |
| Cobrança WhatsApp | ❌ | ✅ |
| Relatórios | ❌ | ✅ |
| Exportação CSV | ❌ | ✅ |
| Suporte | Email | Prioritário |
| Preço | Grátis | R$ 49,90/mês ou R$ 499/ano |

### Integração Cakto

O sistema usa o gateway brasileiro **Cakto** para:
- Checkout redirecionado
- Assinaturas mensais e anuais
- Webhooks para atualização de status
- Reembolsos automáticos (7 dias)

### Fluxo de Pagamento

1. Usuário acessa `/dashboard/upgrade`
2. Escolhe plano mensal (R$ 49,90) ou anual (R$ 499)
3. Redirecionado para checkout Cakto
4. Paga via PIX, cartão ou boleto
5. Webhook atualiza o banco
6. Usuário recebe acesso automático

## 🔐 Sistema de Cancelamento e Reembolso

### Para o Usuário

- **Cancelar Assinatura**: Configurações → Plano → Cancelar
  - Acesso continua até fim do período pago
  - Email enviado para o admin

- **Solicitar Reembolso**: Configurações → Plano → Reembolso
  - Apenas dentro de 7 dias após primeira compra
  - Email enviado para o admin
  - Admin processa no painel Cakto

### Para o Admin

1. Recebe email com dados do usuário
2. Acessa painel Cakto
3. Cancela assinatura ou faz reembolso
4. Sistema atualiza automaticamente via webhook

## 📊 Banco de Dados

### Tabelas

- **profiles**: Usuários com plano, assinatura e status
- **clients**: Clientes com score de confiabilidade
- **charges**: Cobranças com status, recorrência
- **payments**: Registros de pagamento
- **subscriptions**: Histórico de assinaturas

### Row Level Security

Todas as tabelas possuem RLS habilitado - isolamento total de dados entre usuários.

## 🎨 Design System

Componentes prontos:
- Button, Input, Select, Badge, Card, Modal, Toast
- Skeleton para loading states
- Table com sorting e filtros

Cores:
- Primary: Verde/Esmeralda
- Accent: Verde brillante
- Danger: Vermelho
- Background: Preto (dark mode)

## 📝 Configuração do Admin

Para definir seu usuário como admin:

```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'seu-email@dominio.com';
```

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run start        # Servidor produção
npm run lint         # Verificar código
npm run typecheck    # Verificar tipos
```

## 📝 Licença

MIT License - Use livremente.

---

Desenvolvido com ❤️ para o mercado brasileiro

<a href="https://vencja.com.br">
  <img src="https://img.shields.io/badge/Acesse-vencja.com.br-38B2AC?style=for-the-badge" />
</a>