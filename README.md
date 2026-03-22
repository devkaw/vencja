# VenceJa - Gestão Inteligente de Cobranças

![Next.js](https://img.shields.io/badge/Next.js-15.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)
![Supabase](https://img.shields.io/badge/Supabase-2.47-3ECF8E)

## 📋 Descrição

O **VenceJa** é um SaaS completo focado em gestão de cobranças, controle de receita e análise avançada de inadimplência para pequenos negócios no Brasil.

### Principais Funcionalidades

- **Dashboard Inteligente**: Visualize faturamento, atrasos e inadimplência em tempo real
- **Gestão de Clientes**: Cadastro completo com score dinâmico de confiabilidade (0-100)
- **Cobranças Recorrentes**: Sistema automático de geração de novas cobranças
- **Ranking de Inadimplência**: Identifique rapidamente quem mais te prejudica
- **Cobrança via WhatsApp**: Links personalizados sem API paga
- **Exportação CSV**: Análise externa dos seus dados
- **Sistema de Pagamento PIX**: Acesso vitalício com pagamento único (R$ 297)
- **Painel Administrativo**: Gerenciamento de pagamentos pendentes

## 🚀 Tecnologias

- **Frontend**: Next.js 15 com App Router, React 19, TypeScript
- **Estilização**: Tailwind CSS com design system customizado
- **Backend**: API Routes do Next.js
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth (Email + Google)
- **Pagamentos**: Sistema PIX manual com validação administrativa
- **Gráficos**: Chart.js com react-chartjs-2
- **Deploy**: Vercel (pronto)

## 📁 Estrutura do Projeto

```
venceja/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Páginas de autenticação
│   │   ├── (dashboard)/     # Páginas do painel
│   │   │   ├── admin/       # Painel administrativo
│   │   │   ├── clients/     # Gestão de clientes
│   │   │   ├── charges/     # Gestão de cobranças
│   │   │   ├── ranking/     # Ranking de inadimplência
│   │   │   ├── settings/    # Configurações
│   │   │   └── upgrade/     # Página de upgrade PIX
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   ├── ui/              # Componentes do design system
│   │   └── layout/         # Sidebar, Header, etc.
│   ├── lib/
│   │   ├── supabase/       # Cliente Supabase
│   │   ├── subscription.ts  # Lógica de acesso
│   │   └── utils/          # Funções utilitárias
│   ├── types/               # Definições TypeScript
│   └── hooks/              # Custom hooks
├── supabase/
│   └── schema.sql           # Schema do banco
├── SETUP.md                 # Guia completo de configuração
└── package.json
```

## ⚡ Quick Start

### 1. Clonar o Repositório

```bash
git clone <seu-repo>
cd venceja
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

```bash
cp .env.example .env.local
```

Preencha com suas credenciais do Supabase:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

### 4. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Execute o SQL em `supabase/schema.sql` no SQL Editor
3. Configure autenticação e storage

### 5. Executar Localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🌐 Deploy na Vercel

### 1. Preparar Repositório Git

```bash
git init
git add .
git commit -m "Initial commit - VenceJa"
git remote add origin https://github.com/SEU-USUARIO/venceja.git
git push -u origin main
```

### 2. Deploy

1. Acesse [vercel.com](https://vercel.com)
2. Importe o repositório GitHub
3. Configure as Environment Variables
4. Deploy!

Consulte o arquivo `SETUP.md` para o guia completo.

## 📊 Banco de Dados

### Tabelas

- **profiles**: Usuários com plano e status de pagamento
- **clients**: Base de clientes com score de confiabilidade
- **charges**: Cobranças com status e recorrência
- **payments**: Registros de pagamento
- **payment_requests**: Solicitações de pagamento PIX pendentes

### Row Level Security

Todas as tabelas possuem RLS habilitado, garantindo isolamento total de dados entre usuários.

## 💳 Sistema de Pagamento PIX

### Planos

| Recurso | Free | Vitalício Pro |
|---------|------|---------------|
| Clientes | 3 | Ilimitados |
| Dashboard | Básico | Completo |
| Ranking | ❌ | ✅ |
| Exportação | ❌ | ✅ |
| Preço | Grátis | R$ 297 (único) |

### Fluxo de Pagamento

1. Usuário acessa `/dashboard/upgrade`
2. Copia o código PIX
3. Faz o pagamento no banco
4. Volta ao sistema e clica "Já paguei"
5. Envia comprovante
6. Admin aprova em `/dashboard/admin/payments`
7. Usuário recebe acesso vitalício

### Configurar Admin

```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'seu-email@dominio.com';
```

## 🎨 Design System

Componentes prontos para uso:
- Button, Input, Select, Badge
- Card, Modal, Toast
- Skeleton (loading states)
- Progress, etc.

Cores estratégicas:
- Verde/Esmeralda (sucesso/dinheiro)
- Vermelho (alerta/atraso)
- Azul/Esmeralda (principal/ação)

## 🔮 Funcionalidades Futuras

- Notificações por email
- Integração com mensagens via API
- Insights de IA para dívidas
- Dashboard mais avançado
- Aplicativo mobile

## 📝 Licença

MIT License - Use livremente para projetos pessoais e comerciais.

---

Desenvolvido com ❤️ para o mercado brasileiro
