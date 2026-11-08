# Redesign da VenceJá — estratégia, decisões e como testar

Este documento registra o diagnóstico, a direção criativa e o que mudou no frontend. Backend, banco, APIs, webhooks, pagamentos e regras de negócio **não foram alterados**.

Backup do estado anterior: `backup-pre-redesign.tar.gz` (na raiz: `src`, `public`, `tailwind.config.ts`, `package.json`, `package-lock.json`).

---

## 1. Diagnóstico (antes)

- **Identidade genérica**: preto + verde esmeralda + Sora em peso 200–300 em tudo. Números (o dado mais importante do produto) ficavam finos e difíceis de ler. Visual próximo de template de “dark SaaS”.
- **Glassmorphism indiscriminado**: `glass-card` em todos os containers, inclusive tabelas. Pouca hierarquia.
- **Landing estática e com problemas de confiança**: depoimentos com nomes e valores inventados, promessa não verificável (“se cancelar no mesmo mês, não paga nada”), nenhuma demonstração do produto.
- **App**: sem navegação mobile real (botão flutuante minúsculo), modal sem foco preso/ARIA, Chart.js (~70 kB) para dois gráficos, várias inconsistências (cores `gray`/`slate`/`yellow` misturadas, “Atraso” duplicado nas estatísticas de cobranças, limite de score 700/500 em Relatórios quando o score vai de 0 a 100).
- **Ranking** fazia uma consulta por cliente (N+1).
- **Login** ignorava o parâmetro `redirect` que o middleware já enviava.

## 2. Público e argumento de venda

Autônomos e pequenos negócios (prestadores de serviço, professores, estúdios, oficinas) que hoje controlam cobranças no caderno, na planilha ou de cabeça.

| Dor | Como a VenceJá responde (sem prometer o que não faz) |
| --- | --- |
| Esquecer quem deve | Painel com “Precisa de atenção”, calendário, ranking |
| Constrangimento de cobrar | Mensagem pronta e educada no WhatsApp (Pro) |
| Não saber quanto está parado | Em atraso / a receber calculados na hora |
| Planilha dá trabalho | Parcelas e recorrência criadas de uma vez |
| “Vou pagar taxa?” | A VenceJá não intermedia pagamento: sem taxa sobre o que se recebe |
| “É seguro?” | LGPD, conexão segura, garantia de 7 dias no Pro |

Diferencial frente à planilha comunicado de forma interativa (seção “Planilha não cobra ninguém”).

## 3. Direção visual

- **Conceito “livro-caixa líquido”**: superfícies claras e calmas (papel levemente esverdeado) para dados; **vidro apenas na camada que flutua** (navegação, barra inferior mobile, menus, modais, toasts, controles segmentados, CTA principal). O vidro tem brilho especular, borda luminosa em gradiente e fallback opaco quando `backdrop-filter` não existe ou com `prefers-reduced-transparency`.
- **Expo Glass Effect**: é um módulo nativo do iOS (React Native/Expo). Não roda em Next.js/web. A linguagem foi reproduzida em CSS (`.glass`, `.glass-strong`, `.glass-brand` em `src/app/globals.css`).
- **Tema claro como padrão** (melhor leitura no celular, sob luz do dia, e mais confiança para um produto financeiro), **tema escuro completo** via tokens. Segue o sistema; alternância salva por aparelho.
- **Paleta**: verde “dinheiro” mais profundo (`brand-600 #0A5E3E`) em um único matiz (158°), definido por `--green-from` e `--green-to`, usado também na logo e nos botões do WhatsApp; semânticos dedicados para pago / a vencer / em atraso / informativo, com variantes de texto (contraste AA) e de preenchimento (gráficos).
- **Tipografia**: Bricolage Grotesque (títulos, personalidade) + Geist (interface, números tabulares). Sora removida. O `@import` duplicado do Google Fonts foi eliminado (fontes via `next/font`).
- **Marca**: balão de fala gritando “já!”, a cobrança que fala por você. O logo completo lê “vence já!”. Letras convertidas em vetor (`src/components/brand/logo-paths.ts`), então não dependem de fonte carregada. Grafia **VenceJá** no texto.

## 4. Design system

- Tokens em CSS variables (`globals.css`) consumidos pelo Tailwind (`tailwind.config.ts`): `canvas`, `surface`, `ink`, `line`, `brand`, `pos`, `warn`, `neg`, `info`.
- Componentes no padrão shadcn/ui (Radix + `class-variance-authority` + `cn`), escritos à mão para Tailwind 3: `Button` (com `asChild`), `Input`, `Select`, `Modal` (Radix Dialog, vira bottom sheet no celular), `Sheet`, `Switch`, `Tooltip`, `Segmented`, `Badge`, `Card`, `Progress`, `Skeleton`, `Toast` (animado, `aria-live`).
- Dados: `AreaChart`, `DonutChart`, `ScoreRing`, `StackedBar` em SVG próprio (substituem Chart.js), `AnimatedNumber`, `Avatar`, `EmptyState`.
- App: `PageHeader`, `StatCard`, `ChargeRow`, `AuthShell`, `chargeVisual()` (uma regra única de status/cor para cobranças).

### Bibliotecas

| Adicionada | Motivo |
| --- | --- |
| `radix-ui@1.4.2` | Acessibilidade de dialog, switch, tooltip, accordion (foco, teclado, ARIA) |
| `class-variance-authority@0.7.1` | Variantes de componentes (padrão shadcn) |

| Removida | Motivo |
| --- | --- |
| `chart.js`, `react-chartjs-2` | Substituídas por SVG próprio, mais leve e com o visual da marca |

`framer-motion` (já instalada) segue para microinterações, sempre com `MotionConfig reducedMotion="user"` e CSS que respeita `prefers-reduced-motion`.

## 5. Landing page (nova arquitetura)

Server Component (página estática) com ilhas client apenas onde há interação:

1. **Nav de vidro** flutuante + CTA fixo no celular após o hero.
2. **Hero**: “Saiba quem te deve. Cobre em dois toques.” + ilustração do produto (rotulada “dados fictícios”).
3. **Provas honestas** no lugar de depoimentos inventados: sem taxa, nada para instalar, LGPD, garantia de 7 dias.
4. **Planilha vs VenceJá** (interativo).
5. **Demonstração navegável** com dados fictícios claramente identificados: marcar pagamento, ver a mensagem real do WhatsApp (mesmo gerador da conta), lançar cobrança/parcelas, score real dos clientes, calendário. Metas de exploração e CTA aparecem após interação.
6. **Como funciona** em 3 passos.
7. **Score interativo**: o visitante muda o histórico e vê o score recalculado pela mesma função `calcularScore` do app.
8. **Recursos** (bento), com o WhatsApp como destaque e trechos reais das mensagens.
9. **Simulador de tempo**: tudo baseado nos números do visitante, com aviso “não é promessa”.
10. **Preços** com alternância mensal/anual (“2 meses grátis” = economia exata de R$ 99,80), comparação completa sob demanda.
11. **FAQ** reescrito (inclui “a VenceJá recebe o dinheiro por mim?” e “o WhatsApp envia sozinho?”).
12. **CTA final** e rodapé. JSON-LD de `SoftwareApplication` (preços) e `FAQPage`.

## 6. Aplicação autenticada

- **Shell**: sidebar com ação “Nova cobrança”, grupos, badge PRO, medidor de uso do plano grátis (x/3 clientes, y/10 cobranças) e upsell; recolhível. **Celular**: barra superior de vidro + barra inferior de vidro com botão central “+” e menu “Mais” em sheet.
- **Painel**: saudação, onboarding em 3 passos para contas novas, KPIs (recebido no mês, em atraso, a receber, recebido no total), “Precisa de atenção”, “Vence em breve”, gráfico de 12 meses, situação das cobranças, atividade recente, quem mais deve.
- **Cobranças**: filtros com contagem, busca, ordenação, tabela no desktop e linhas compactas no celular, banner claro de limite.
- **Nova cobrança**: resumo ao vivo (valor total, primeira e última parcela), atalhos 3x/6x/12x, erros somem ao editar, estado vazio que orienta a cadastrar cliente primeiro.
- **Detalhe da cobrança**: “recibo” com status, ações principais lado a lado, **prévia da mensagem do WhatsApp**, cartão do cliente com score, série recorrente. Fluxos de pagamento total/parcial, edição e exclusão preservados linha a linha.
- **Clientes / detalhe**: score em anel, totais, cobranças agrupadas (em atraso, a vencer, pagas), cobrança em lote no WhatsApp.
- **Calendário**: totais do mês que funcionam como filtros, valores por dia, painel do dia selecionado.
- **Inadimplência**: ranking com prioridade visual e detalhes expansíveis (2 consultas em vez de N+1).
- **Relatórios**: indicadores, gráfico mensal, tabelas legíveis, exportação CSV mantida.
- **Configurações**: seções (perfil, segurança, plano, aparência, excluir conta). Cancelamento/reembolso preservados. Removido o item “2FA — em breve” (não existe).
- **Planos e sucesso**: comparação, garantia, revisão do pedido antes do checkout da Cakto.
- **Auth** (login, cadastro, recuperar/redefinir senha, confirmação de e-mail) em layout dividido com prévia do produto. Login agora respeita `?redirect=` (apenas caminhos internos).
- **404** com a marca.

## 7. Validação

- `npx tsc --noEmit`: sem erros.
- `npx eslint src`: 0 erros (9 avisos de padrões pré-existentes: dependências de efeito e `window.location` intencional no logout/exclusão).
- `next build`: sucesso. A landing `/` agora é estática.
- Teste no navegador (desktop 1360px e celular 375px, temas claro e escuro) contra um **Supabase falso local** (`scripts/mock-supabase.mjs`), sem tocar em produção:
  - login com erro e com sucesso; redirecionamento do middleware; logout;
  - painel, onboarding, KPIs, gráficos;
  - criar cobrança (validação, 3 parcelas, limite de 10 do grátis e banner de upgrade);
  - registrar pagamento parcial (cobrança paga + restante criado + cliente recalculado);
  - cadastrar cliente (telefone normalizado com +55);
  - calendário, inadimplência, relatórios (redireciona no grátis, abre no Pro), configurações, planos;
  - checkout: a rota real é chamada e, sem credenciais da Cakto localmente, mostra erro amigável;
  - plano Pro: link `wa.me` com a mensagem correta;
  - landing: todas as interações da demonstração, comparação, score, simulador, preços, FAQ.

### Como repetir o teste local

```bash
node scripts/mock-supabase.mjs
```

Em outro terminal, suba o Next apontando para o mock (as credenciais de teste estão no topo do script):

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=local RESEND_API_KEY=re_local RESEND_FROM_EMAIL=noreply@example.com npx next dev
```

Para ver o plano Pro: `curl 'http://127.0.0.1:54321/__mock/plan?plano=pro'`.

### O que não foi possível validar localmente

- Supabase real (RLS, e-mails de verificação/recuperação via Resend) e o checkout real da Cakto/webhooks. O código dessas integrações não foi alterado, mas vale um teste em staging com as variáveis reais antes do deploy.

## 8. Movimento

- `src/components/motion/primitives.tsx`: `Reveal`, `Stagger`, `AnimatedWords` (títulos palavra por palavra), `ScrollSection` (transição entre seções ligada à rolagem), `GlassPanel` (cresce no hover), `ScrollProgress`.
- Troca de tema: revelação circular a partir do botão com View Transitions (`theme-toggle.tsx`), com fade de cores como alternativa.
- Navegação: fade entre áreas em `src/app/template.tsx` (só opacidade, para não quebrar elementos `fixed`) e entrada de página no layout do dashboard.
- `Card` anima sozinho ao entrar na tela e cresce no hover, então qualquer tela nova herda isso.
- Tudo respeita `prefers-reduced-motion`.

## 9. Próximos passos sugeridos

- Lembretes automáticos de vencimento (e-mail/WhatsApp) seriam o próximo grande argumento de venda — hoje a landing não promete isso.
- Medir conversão por etapa (visita → interação na demo → cadastro → 1º cliente → 1ª cobrança → Pro) com eventos no Vercel Analytics.

## 10. Dashboard completo (novembro de 2026)

- **Regras em um só lugar:** `src/lib/domain` concentra status, saldo, score, indicadores, CSV e aviso diário. São funções puras, testadas com `npm test`.
- **Score novo:** só contam cobranças pagas ou vencidas. Com cobrança vencida em aberto, a nota vai até 79, ou até 49 com mais de 30 dias. Sem cobrança que conte, o cliente fica "Sem histórico". As colunas `clients.score`, `total_pago` e `total_atrasado` não são mais lidas nem escritas.
- **Telas compartilhadas:** `src/components/screens` roda no dashboard (`SupabaseWorkspace`) e na demonstração da landing (`DemoWorkspace`).
- **Layout por container:** as telas usam `@container`, para responder à largura da janela da demo.
- **Pagamento:** passa pela rota `POST /api/charges/[id]/pay`, com a regra de `planejarPagamento`.

### Rodar localmente

```bash
MOCK_PORT=54322 node scripts/mock-supabase.mjs
```

Em outro terminal, use a configuração `app-completo` de `.claude/launch.json` (porta 3100). Controles do mock:

- `curl 'http://127.0.0.1:54322/__mock/seed?perfil=cheio'` (`vazio`, `basico`, `limite`, `cheio`, `mil`, `dificil`)
- `curl 'http://127.0.0.1:54322/__mock/plan?plano=pro'` (ou `free`)
- `curl 'http://127.0.0.1:54322/__mock/settings-table?on=0'` simula a tabela de avisos ausente

### Quando decidir publicar

1. Rodar `supabase/migrations/20261106_dashboard_completo.sql` no SQL Editor.
2. Criar `CRON_SECRET` na Vercel. Não definir `DIGEST_DRY_RUN` em produção.
3. Depois do deploy, testar: registrar pagamento total e parcial; criar o 4º cliente e a 11ª cobrança no grátis (deve bloquear); chamar o aviso diário com o segredo e conferir o e-mail recebido; ligar e desligar Configurações › Avisos.
