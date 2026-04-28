# GUIA COMPLETO DE CONFIGURAÇÃO - VENCEJA

## 📋 ÍNDICE
1. [Configurar Supabase](#configurar-supabase)
2. [Configurar Variáveis de Ambiente](#configurar-variáveis-de-ambiente)
3. [Configurar Bucket de Storage](#configurar-bucket-de-storage)
4. [Executar o Projeto Localmente](#executar-o-projeto-localmente)
5. [Deploy na Vercel](#deploy-na-vercel)
6. [Configurar Admin](#configurar-admin)

---

## 1. CONFIGURAR SUPABASE

### 1.1 Criar Conta
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Conecte com GitHub ou cadastre-se com email
4. Confirme seu email

### 1.2 Criar Novo Projeto
1. Clique em "New Project"
2. Preencha os dados:
   - **Name**: VenceJa
   - **Database Password**: (gere uma senha forte e salve!)
   - **Region**: Escolha a mais próxima de você (São Paulo: `South America (São Paulo)`)
3. Clique em "Create new project"
4. Aguarde ~2 minutos até o projeto estar pronto

### 1.3 Obter as Chaves da API
1. Vá em **Settings** > **API**
2. Você verá duas chaves importantes:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role secret**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

⚠️ **IMPORTANTE**: A `service_role` chave é secreta! Nunca compartilhe.

### 1.4 Executar o Schema
1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole todo o conteúdo do arquivo `supabase/schema.sql`
4. Clique em **Run**

### 1.5 Configurar Autenticação
1. Vá em **Authentication** > **Providers**
2. Configure **Email**:
   - Enable Email Autoresponder: OFF
   - Confirm email: ON (recomendado)
3. (Opcional) Configure **Google OAuth**:
   - Enable Google: ON
   - Cole o Client ID e Client Secret do Google Cloud Console

### 1.6 Configurar Storage
1. Vá em **Storage** > **New bucket**
2. Crie um bucket chamado: `comprovantes`
3. Configure como:
   - Public bucket: YES
4. Adicione as políticas de acesso (execute no SQL Editor):

```sql
-- Permitir upload para usuários autenticados
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Permitir visualização de uploads do próprio usuário
CREATE POLICY "Allow owner reads" ON storage.objects
  FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir que usuários vejam seus próprios comprovantes
CREATE POLICY "Users can view own comprovantes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'comprovantes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Permitir upload de comprovantes
CREATE POLICY "Users can upload comprovantes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'comprovantes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 2. CONFIGURAR VARIÁVEIS DE AMBIENTE

Crie um arquivo `.env.local` na raiz do projeto com:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 3. CONFIGURAR BUCKET DE STORAGE

O bucket `comprovantes` foi criado anteriormente. As políticas de acesso já foram configuradas no passo anterior.

---

## 4. EXECUTAR O PROJETO LOCALMENTE

### 4.1 Instalar Dependências
```bash
npm install
```

### 4.2 Configurar Variáveis de Ambiente
Copie `.env.example` para `.env.local` e preencha os valores.

### 4.3 Iniciar o Servidor
```bash
npm run dev
```

### 4.4 Acessar
- **Frontend**: http://localhost:3000
- **Landing Page**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard
- **Login**: http://localhost:3000/login
- **Cadastro**: http://localhost:3000/register
- **Upgrade**: http://localhost:3000/dashboard/upgrade
- **Admin (se configurado)**: http://localhost:3000/dashboard/admin/payments

### 4.5 Testar Fluxo Completo
1. Cadastre-se na aplicação
2. Verifique o email (ou use Google OAuth)
3. Adicione clientes e cobranças
4. Teste o ranking de inadimplência
5. Acesse a página de upgrade
6. Copie o código PIX
7. Simule um upload de comprovante

---

## 5. DEPLOY NA VERCEL

### 5.1 Preparar Repositório
1. Crie uma conta no [GitHub](https://github.com) se não tiver
2. Crie um repositório novo
3. Faça upload de todo o código:
```bash
git init
git add .
git commit -m "Initial commit - VenceJa"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/venceja.git
git push -u origin main
```

### 5.2 Deploy na Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Importe o repositório do GitHub
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Environment Variables**: Adicione todas as variáveis do `.env.local`

### 5.3 Configurar Variáveis de Ambiente na Vercel
No Vercel Dashboard > Settings > Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL = https://seu-dominio.vercel.app
```

### 5.4 Atualizar URLs no Supabase
No Supabase Dashboard > Authentication > URL Configuration:
- **Site URL**: `https://seu-dominio.vercel.app`
- **Redirect URLs**: `https://seu-dominio.vercel.app/auth/callback`

### 5.5 Deploy
1. Clique em "Deploy"
2. Aguarde ~2 minutos
3. Sua aplicação estará no ar!

---

## 6. CONFIGURAR ADMIN

Para configurar um usuário como administrador, execute o seguinte SQL no Supabase:

```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'seu-email@dominio.com';
```

Após configurar, o usuário terá acesso ao painel administrativo em `/dashboard/admin/payments`.

---

## 📋 SISTEMA DE PAGAMENTO PIX

O VenceJa utiliza um sistema de pagamento via PIX simples e manual:

1. **Chave PIX**: A chave PIX está configurada no código (pode ser alterada em `src/types/index.ts`)
2. **Fluxo de Pagamento**:
   - Usuário acessa `/dashboard/upgrade`
   - Copia o código PIX
   - Faz o pagamento no seu banco
   - Volta ao sistema e clica em "Já paguei"
   - Envia o comprovante
   - Aguarda aprovação do admin
3. **Aprovação**:
   - Admin acessa `/dashboard/admin/payments`
   - Visualiza os comprovantes pendentes
   - Aprova ou rejeita o pagamento
   - Se aprovado, usuário ganha acesso vitalício

---

## 🎉 PARABÉNS!

Você configurou o VenceJa com sucesso! Qualquer dúvida, abra uma issue no repositório.

---

## 📞 SUPORTE

- Sistema de Monetização: PIX via pagamento único (R$ 297)
- Sem necessidade de APIs externas além do Supabase
