# Publicar a VenceJá em produção

Roteiro único para o deploy. Marque cada item. O comando abaixo trava enquanto faltar dado da empresa ou variável:

```bash
npm run check:producao
```

## 1. Obrigatório antes de publicar

### Responsável pelo site
- [ ] Cadastrar na Vercel, em Production: `EMPRESA_NOME` (nome completo), `EMPRESA_DOCUMENTO` (CPF) e `EMPRESA_ENDERECO`. O Decreto 7.962/2013 pede esses dados em sites de venda. Eles aparecem no rodapé, nas páginas legais e em Ajuda, mas não nos e-mails.
- [ ] Publicar de novo depois de mudar essas variáveis: as páginas estáticas leem os valores no build.
- [ ] Conferir se a conta da Cakto está no mesmo nome.
- [ ] Encarregado de dados: confirmar se a dispensa de agente de pequeno porte (Resolução CD/ANPD nº 2/2022) vale para o seu caso. Se não valer, defina `EMPRESA_ENCARREGADO`. O canal de atendimento continua obrigatório.
- [ ] Confirmar com um contador como declarar a renda como pessoa física.
- [ ] Confirmar `PRAZO_ATENDIMENTO` (hoje "2 dias úteis"). É um compromisso público nos Termos e na Política de Reembolso.
- [ ] Criar e testar as caixas `suporte@venceja.com.br`. É o canal dos direitos de LGPD.

### Revisão jurídica
- [ ] Pedir a um advogado que revise Termos, Privacidade, Reembolso e Cookies. Os textos descrevem o que o site faz, mas não substituem essa revisão.

### Banco (SQL Editor do Supabase)
- [x] Rodar `supabase/migrations/20261106_dashboard_completo.sql` (aplicada em 08/11/2026).
- [x] Rodar `supabase/migrations/20261108_permissoes.sql` (aplicada em 08/11/2026).
- [ ] Rodar `supabase/verificacao-seguranca.sql` e conferir cada bloco. Só leitura.
- [ ] Remover o que não é usado, se existir em produção: colunas `profiles.cpf`, `profiles.phone`, `profiles.full_name` e tabelas `payment_requests` e `notifications`. Faça backup antes.

### Autenticação (painel do Supabase)
- [ ] Senha mínima de 8 caracteres, igual ao site.
- [ ] Ligar a proteção contra senhas vazadas.
- [ ] Conferir URL do site e URLs de redirecionamento para o domínio final.

### Plano do Supabase
- [ ] Confirmar que o projeto não pausa por inatividade e que há backups. Em planos gratuitos, o projeto pode pausar e não há backup diário.

### Vercel
- [ ] Variáveis: `CRON_SECRET` e `EMAIL_UNSUBSCRIBE_SECRET` com 32 caracteres ou mais, e todas as demais de `.env.example`.
- [ ] Não definir `DIGEST_DRY_RUN`, `NEXT_PUBLIC_SENTRY_DISABLED` nem `NEXT_DIST_DIR`.
- [ ] `NEXT_PUBLIC_APP_URL=https://www.venceja.com.br`.
- [ ] Conferir se o plano permite o agendamento diário de `vercel.json`.

### E-mail (Resend)
- [ ] Domínio verificado, com SPF, DKIM e DMARC.

### Cakto
- [ ] Webhook apontando para o domínio final, com o mesmo `CAKTO_WEBHOOK_SECRET`.
- [ ] Ofertas mensal e anual com os preços do site: R$ 49,90 e R$ 499,00.
- [ ] Definir quem atende os pedidos: cancelamento e reembolso são feitos à mão no painel da Cakto, depois do e-mail que chega em `ADMIN_EMAIL`.

## 2. Testar depois do deploy

- [ ] Criar conta, confirmar e-mail, entrar e sair.
- [ ] Recuperar senha.
- [ ] Assinar o Pro de verdade e ver a ativação pelo webhook.
- [ ] Pedir reembolso e cancelamento, e receber os e-mails.
- [ ] Registrar pagamento total e parcial.
- [ ] No grátis, tentar o 4º cliente e a 11ª cobrança: o banco deve recusar.
- [ ] Chamar o aviso diário com o segredo e conferir o e-mail e o link de descadastro.
- [ ] Baixar os dados e excluir uma conta de teste.
- [ ] Conferir os cabeçalhos em securityheaders.com.

## 3. Pontos a acompanhar

- **Registros de acesso:** o Marco Civil (art. 15) pede guarda por 6 meses. Os logs da Vercel duram bem menos, então avalie um log drain.
- **CSP:** `script-src` mantém `'unsafe-inline'` por causa da landing estática. Dá para trocar por nonce, com custo de perder o estático.
- **Enumeração de e-mail:** o cadastro avisa quando o e-mail já existe. É uma escolha de usabilidade comum.
- **Dependências:** restam avisos moderados só em ferramentas de build do Sentry. Sem correção sem atualização maior.
- **Limite de tentativas:** depende da migração. Sem ela, cai em contador por instância, mais fraco.
