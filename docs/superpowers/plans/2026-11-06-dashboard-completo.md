# Dashboard completo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar, só localmente, o dashboard completo redesenhado, com score novo, funcionalidades novas e a landing fiel ao produto.

**Architecture:** Funções puras em `src/lib/domain` concentram todas as regras. Um contrato `Workspace` expõe dados e ações, com implementação Supabase no dashboard e em memória na demo. As mesmas telas de `src/components/screens` rodam nos dois.

**Tech Stack:** Next 16, React 19, TypeScript, Tailwind 3 com `@tailwindcss/container-queries`, Framer Motion, Radix, Supabase, Resend, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-06-dashboard-completo-design.md`

## Global Constraints

- Sem deploy. Tudo roda em `localhost` contra `scripts/mock-supabase.mjs`. Não executar nada no Supabase real, na Vercel, na Cakto ou na Resend.
- O projeto não é repositório git: não há commits. O ponto de restauração é `backup-pre-dashboard-completo.tar.gz`.
- Paleta: só os tokens existentes (`canvas`, `surface`, `ink`, `line`, `brand`, `pos`, `warn`, `neg`, `info`). Fontes: Bricolage e Geist.
- Tailwind e `globals.css` só recebem acréscimos. A aparência da landing não muda fora da seção 9 do spec.
- Interface em português do Brasil, grafia "VenceJá".
- Faixas do score: 80+ "Bom pagador", 50–79 "Atenção", até 49 "Risco alto", `null` "Sem histórico".
- Plano grátis: 3 clientes e 10 cobranças, vindos de `PLANS.free.limits`.
- Toda animação respeita `prefers-reduced-motion`. Nenhum botão fica com área de toque menor que 44px no celular.
- URLs de `/dashboard/**` não mudam.

## Review Focus

- Datas perto da meia-noite: vencimento é dia de calendário, nunca UTC. Cobrança que vence hoje não está atrasada em nenhum horário.
- Clique duplo em "Marcar como pago": registra um único pagamento e a segunda tentativa avisa sem erro técnico.
- Usuário grátis no limite registra pagamento parcial: o restante é criado mesmo acima de 10 cobranças.
- Conta vazia e conta com mil cobranças: todas as telas têm estado vazio útil e continuam fluidas.
- Dados difíceis: nome longo, valor de R$ 1.000.000,00, e `;`, aspas, quebra de linha ou `=` no começo de campos do CSV não quebram layout nem planilha.

---

### Task 1: Base, status da cobrança e score

**Files:**
- Create: `backup-pre-dashboard-completo.tar.gz`, `vitest.config.ts`, `src/lib/domain/charges.ts`, `src/lib/domain/score.ts`
- Modify: `package.json`, `src/lib/ui/status.ts`, `src/lib/utils/index.ts`
- Test: `src/lib/domain/__tests__/charges.test.ts`, `src/lib/domain/__tests__/score.test.ts`

**Interfaces:**
- Produces:
  - `type ChargeLike = Pick<Charge, 'valor' | 'valor_pago' | 'status' | 'data_vencimento' | 'data_pagamento'>`
  - `chargeState(c: ChargeLike, hoje: Date): 'pago' | 'atrasado' | 'hoje' | 'a_vencer'`
  - `saldoAberto(c: ChargeLike): number`
  - `diasDeAtraso(c: ChargeLike, hoje: Date): number`
  - `calcularScore(charges: ChargeLike[], hoje?: Date): ScoreResult`
  - `ScoreResult = { value: number | null; base: number | null; cap: 79 | 49 | null; counted: number; criteria: { key: 'pagas' | 'pontualidade' | 'atrasos' | 'valor'; label: string; points: number; max: number }[] }`
  - `scoreTone(score: number | null)`, agora com a faixa neutra "Sem histórico"

- [ ] **Step 1:** Criar o backup com `src public supabase scripts docs tailwind.config.ts package.json package-lock.json`, excluindo `node_modules` e `.next`. Conferir com `tar -tzf ... | wc -l`, resultado maior que 100.
- [ ] **Step 2:** Instalar `vitest` e `@tailwindcss/container-queries` como dev dependencies, adicionar o script `"test": "vitest run"` e configurar o alias `@`.
- [ ] **Step 3: Write the failing test** `score.test.ts`, com data fixa `hoje = 2026-11-06` e cobranças de R$ 100:

```ts
expect(calcularScore([], hoje).value).toBeNull();
expect(calcularScore([aVencer(30)], hoje).value).toBeNull();
expect(calcularScore([aVencer(0)], hoje).value).toBeNull();
expect(calcularScore([paga(-1, -1), ...onzeFuturas], hoje).value).toBe(100);
expect(calcularScore([paga(-30, -30), aVencer(1)], hoje).value).toBe(100);
expect(calcularScore([paga(-400, -400), vencida(-300)], hoje)).toMatchObject({ value: 49, base: 55, cap: 49 });
expect(calcularScore([paga(-40, -40), paga(-30, -30), paga(-20, -20), vencida(-10)], hoje)).toMatchObject({ value: 79, cap: 79 });
expect(calcularScore([paga(-60, -45), paga(-40, -25)], hoje).value).toBe(60);
expect(calcularScore([vencida(-31)], hoje).cap).toBe(49);
expect(calcularScore([vencida(-30)], hoje).cap).toBe(79);
```

- [ ] **Step 4:** `charges.test.ts` cobre: vencimento hoje às 00:01 e 23:59 locais é `hoje`; ontem é `atrasado`; `status: 'parcial'` usa `valor - valor_pago`; valores em string, como vêm do Postgres, viram número.
- [ ] **Step 5:** Rodar `npm test`. Expected: FAIL, módulos inexistentes.
- [ ] **Step 6:** Implementar a seção 6 do spec. Pagas contam por `data_pagamento`. Vencidas em aberto contam com dias até `hoje`. Datas sempre via `parseDateLocal`.
- [ ] **Step 7:** Remover `calcularScore`, `getScoreColor` e `getScoreBg` de `src/lib/utils/index.ts`. Ajustar os imports até `npx tsc --noEmit` só acusar o que as tarefas seguintes substituem; nesta tarefa, os chamadores usam `calcularScore(...).value ?? 0` temporariamente.
- [ ] **Step 8:** Rodar `npm test`. Expected: PASS.

### Task 2: Clientes, métricas e CSV

**Files:**
- Create: `src/lib/domain/clients.ts`, `src/lib/domain/metrics.ts`, `src/lib/domain/csv.ts`
- Modify: `src/lib/utils/index.ts` (mensagens de WhatsApp neutras)
- Test: `src/lib/domain/__tests__/clients.test.ts`, `metrics.test.ts`, `csv.test.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - `ClientSummary = { client: Client; charges: Charge[]; score: ScoreResult; pago: number; emAtraso: number; aReceber: number; qtdAtrasadas: number; pontualidade: number | null; prazoMedioDias: number | null; ultimoPagamento: string | null }`
  - `resumirClientes(clients: Client[], charges: Charge[], hoje: Date): ClientSummary[]`
  - `calcularPainel(charges: Charge[], summaries: ClientSummary[], hoje: Date): PainelMetrics`, com `recebidoMes`, `recebidoMesAnterior`, `variacaoMes` (`number | null`), `previstoMes`, `emAtraso`, `aReceber`, `taxaRecebimento`, `prazoMedioDias`, contagens
  - `serieMensal(charges, hoje, meses = 12): { label: string; inicio: Date; recebido: number; previsto: number; atraso: number }[]`
  - `previsaoCaixa(charges, hoje, dias = 30): { semana: string; valor: number; qtd: number }[]`
  - `distribuicaoScore(summaries): Record<'bom' | 'atencao' | 'risco' | 'sem_historico', number>`
  - `rankingInadimplencia(summaries, hoje): RankingItem[]`, ordenado por valor, quantidade e média de dias
  - `resumoPeriodo(charges, inicio, fim, hoje): PeriodoResumo`
  - `gerarCsv(headers: string[], rows: (string | number | null)[][]): string`

- [ ] **Step 1: Write the failing tests:** `recebidoMes` agrupa por `data_pagamento` e não por vencimento; `variacaoMes` é `null` com mês anterior zerado; cobrança paga em dezembro com vencimento em novembro entra em dezembro; `previsaoCaixa` ignora vencidas; `distribuicaoScore` separa "Sem histórico".
- [ ] **Step 2:** CSV: `gerarCsv(['Nome'], [['A;B "C"\nD']])` igual a `'﻿Nome\r\n"A;B ""C""\nD"'`; campo que começa com `=`, `+`, `-` ou `@` recebe `'` na frente; número `1234.5` vira `1234,50`.
- [ ] **Step 3:** Rodar `npm test`. Expected: FAIL.
- [ ] **Step 4:** Implementar os três módulos. Trocar nos dois modelos de mensagem o trecho "para ficar tranquil..." por "Que tal já quitar e deixar isso resolvido?" e o nome padrão `VenceJa` por `VenceJá`.
- [ ] **Step 5:** Rodar `npm test`. Expected: PASS.

### Task 3: Banco, rotas e mock

**Files:**
- Create: `supabase/migrations/20261106_dashboard_completo.sql`, `src/app/api/charges/[id]/pay/route.ts`, `src/app/api/cron/daily-digest/route.ts`, `src/lib/domain/digest.ts`, `src/emails/templates/daily-digest-email.ts`, `vercel.json`
- Modify: `scripts/mock-supabase.mjs`, `.env.example`, `src/lib/email/payment-notifications.ts`
- Test: `src/lib/domain/__tests__/digest.test.ts`

**Interfaces:**
- Produces:
  - `POST /api/charges/[id]/pay` com `{ valor: number; data: string }`, respondendo `200 { charge, restante? }`, `401`, `404`, `409 { error: 'already_paid' }` ou `422`
  - `montarDigest(charges: Charge[], hoje: Date): { venceHoje: Charge[]; venceuOntem: Charge[]; totalAtraso: number } | null`, `null` quando as duas listas estão vazias
  - Tabela `notification_settings(user_id uuid pk, daily_email boolean default true, last_sent_on date)` com RLS de select, insert e update do próprio usuário
  - Erro Postgres `P0001` com mensagem `plan_limit`

- [ ] **Step 1:** Escrever o teste de `montarDigest`: `null` sem eventos; cobrança paga é ignorada; vencida há 5 dias sozinha não dispara envio, mas entra em `totalAtraso`.
- [ ] **Step 2:** Rodar, ver falhar, implementar e ver passar.
- [ ] **Step 3:** Escrever o SQL: tabela, gatilhos `BEFORE INSERT` em `clients` e `charges` com função `SECURITY DEFINER` e `search_path = public`, que retorna sem bloquear quando `auth.role() = 'service_role'` e aplica a regra de `hasPremiumAccess` (`plano = 'pro'` e `subscription_ends_at` nulo ou futuro).
- [ ] **Step 4:** Implementar a rota de pagamento portando a lógica de `charges/[id]/page.tsx:93-215`: arredondamento, cálculo de `dias_atraso`, restante primeiro, guarda `.neq('status', 'pago')`, compensação e insert em `payments`. Autenticar com o cliente de servidor; escrever com service role.
- [ ] **Step 5:** Implementar o cron: `Authorization: Bearer ${CRON_SECRET}`, data em `America/Sao_Paulo`, ignorar quem desligou ou já recebeu no dia, gravar `last_sent_on` após o envio, sem expor dados nos logs. Sem a tabela, responder 200 com `skipped`.
- [ ] **Step 6:** Ampliar o mock: 8 clientes e cerca de 60 cobranças em 14 meses, tabela `notification_settings`, suporte à service key e regra de limite retornando `P0001`. Adicionar `/__mock/seed?perfil=vazio|cheio|mil` e `/__mock/seed?perfil=limite`.
- [ ] **Step 7:** Testar por `curl` contra o mock e `next dev`: pagamento total, duplicado (409), parcial no limite (200), cron com e sem segredo (200 e 401).

### Task 4: Workspace e infraestrutura de telas

**Files:**
- Create: `src/components/workspace/types.ts`, `workspace-context.tsx`, `supabase-workspace.tsx`, `demo-workspace.tsx`, `workspace-link.tsx`
- Modify: `tailwind.config.ts` (plugin), `src/components/ui/modal.tsx`, `src/components/ui/sheet.tsx`, `src/components/ui/tooltip.tsx` (prop `container`), `src/app/dashboard/layout.tsx`, `src/components/data/charts.tsx` (`ScoreRing` aceita `null`)
- Test: `src/components/workspace/__tests__/demo-workspace.test.ts`

**Interfaces:**
- Consumes: Tasks 1 a 3.
- Produces:
  - `useWorkspace(): Workspace`
  - `Workspace = { mode: 'live' | 'demo'; loading: boolean; profile: Profile | null; isPro: boolean; userName: string; email: string; hoje: Date; clients: Client[]; charges: ChargeWithClient[]; summaries: ClientSummary[]; painel: PainelMetrics; actions: WorkspaceActions; portalContainer: HTMLElement | null }`
  - `WorkspaceActions`, cada ação retornando `Promise<{ ok: true } | { ok: false; error: string; code?: 'limit' | 'already_paid' }>`: `registrarPagamento({ chargeId, valor, data })`, `criarCobrancas(drafts)`, `atualizarCobranca(id, patch)`, `excluirCobranca(id)`, `excluirSerie(id)`, `salvarCliente(draft)`, `excluirCliente(id)`, `recarregar()`
  - `<WLink href className>` e `useWorkspaceRouter(): { push(path: string): void; pathname: string; params: URLSearchParams }`

- [ ] **Step 1:** Escrever o teste do reducer da demo: `registrarPagamento` parcial cria o restante; pagar duas vezes retorna `already_paid`; score e painel mudam após pagar; reset restaura os dados.
- [ ] **Step 2:** Rodar, ver falhar, implementar e ver passar. A lógica de pagamento da demo vem de uma função pura `aplicarPagamento(charges, input, hoje)` em `charges.ts`, para não duplicar regra.
- [ ] **Step 3:** Implementar `SupabaseWorkspace` no layout: leitura única, atualização do cache após ações, recarga em `visibilitychange`, tradução de `P0001 plan_limit` para `code: 'limit'`.
- [ ] **Step 4:** Rodar `npx tsc --noEmit`, `npm test` e abrir `/dashboard` no mock. Expected: painel antigo funcionando com o novo provedor.

### Task 5: Kit visual do dashboard

**Files:**
- Create em `src/components/screens/kit/`: `page-hero.tsx`, `kpi-tile.tsx`, `section.tsx`, `list-card.tsx`, `quick-actions.tsx`, `payment-sheet.tsx`, `status-pill.tsx`, `timeline.tsx`, `score-card.tsx`
- Create em `src/components/data/`: `spark.tsx`, `bars.tsx`, `forecast.tsx`, `score-distribution.tsx`
- Modify: `src/app/globals.css` (acréscimos)

**Interfaces:**
- Produces, com props tipadas e usadas nas Tasks 7 a 12:
  - `<PageHero eyebrow title description actions tone? />`, título com `AnimatedWords`, `dot-grid` mascarado e marca d'água
  - `<LeadPanel>`, bloco `glass-brand` com raio de 32px
  - `<KpiTile label value kind delta? spark? tone sub? />`
  - `<QuickActions charge summary />`, com pagar e cobrar, e bloqueio Pro quando for o caso
  - `<PaymentSheet charge open onClose />`, com data, opção parcial e confirmação animada
  - `<ScoreCard summary />`, com anel grande, critérios animados e teto explicado
  - `<Timeline events />`

- [ ] **Step 1:** Implementar o kit, com todos os componentes usando `@container` e não breakpoints de viewport.
- [ ] **Step 2:** Criar `src/app/dashboard/_kit/page.tsx` temporária mostrando cada componente com dados extremos (R$ 1.000.000,00, nome de 60 caracteres, zero, `null`).
- [ ] **Step 3:** Conferir na página temporária em 1360px e 375px, claro e escuro, com captura de cada combinação. Apagar a página ao terminar.

### Task 6: Shell

**Files:**
- Create: `src/components/layout/command-palette.tsx`, `src/components/layout/top-bar.tsx`
- Modify: `src/components/layout/sidebar.tsx`, `src/app/dashboard/layout.tsx`

- [ ] **Step 1:** Barra lateral com bloco da marca, grupos "Operação" e "Conta", contador vermelho de atrasos em Cobranças e Inadimplência, medidor de plano refeito.
- [ ] **Step 2:** Top bar de vidro no desktop, com resumo do dia, busca e tema. Paleta com Cmd/Ctrl+K, busca por cliente e cobrança, ações "Nova cobrança" e "Novo cliente", teclado completo e foco preso.
- [ ] **Step 3:** Celular: barra inferior mantida, com acesso à busca. Conferir no navegador navegação, teclado, 375px e dark mode.

### Task 7: Painel

**Files:**
- Create: `src/components/screens/painel-screen.tsx`
- Modify: `src/app/dashboard/page.tsx`

Layout, de cima para baixo, em grade de 12 colunas no container largo:

1. Hero com saudação e ações.
2. `LeadPanel` de 7 colunas: recebido no mês, previsto, progresso e variação. Ao lado, 5 colunas: "Hoje", com o que vence hoje e atrasos mais antigos, com ações rápidas.
3. Faixa de 4 `KpiTile`: a receber, em atraso, taxa de recebimento e prazo médio.
4. "Precisa de atenção" e "Vence em breve" com ações rápidas.
5. Gráfico de 12 meses (8 colunas) e previsão de 30 dias (4 colunas).
6. Distribuição do score, quem mais deve e atividade recente.

- [ ] **Step 1:** Implementar. Onboarding continua para conta nova.
- [ ] **Step 2:** No mock, conferir perfis `vazio`, `cheio` e `mil`, em grátis e Pro. Registrar um pagamento e ver cartões, gráficos e listas mudarem sem recarregar.

### Task 8: Cobranças

**Files:**
- Create: `src/components/screens/charges-screen.tsx`, `charge-detail-screen.tsx`, `charge-form-screen.tsx`
- Modify: `src/app/dashboard/charges/page.tsx`, `charges/new/page.tsx`, `charges/[id]/page.tsx`, `src/components/app/charge-row.tsx`

- [ ] **Step 1:** Lista: hero com barra empilhada por situação, filtros com contagem, tabela e cartões com `QuickActions`.
- [ ] **Step 2:** Nova cobrança: formulário à esquerda e recibo ao vivo à direita. Preservar validação, duplicidade, parcelas até 60, atalhos 3x/6x/12x e banner de limite.
- [ ] **Step 3:** Detalhe: recibo em destaque, linha do tempo, prévia do WhatsApp, cliente com score, série. Preservar edição, exclusão e exclusão da série pendente.
- [ ] **Step 4:** No mock, testar criar 3 parcelas, duplicidade, limite do grátis, pagamento total e parcial, clique duplo, edição e exclusão de série.

### Task 9: Clientes

**Files:**
- Create: `src/components/screens/clients-screen.tsx`, `client-detail-screen.tsx`, `client-form-screen.tsx`
- Modify: `src/app/dashboard/clients/page.tsx`, `clients/new/page.tsx`, `clients/[id]/page.tsx`

- [ ] **Step 1:** Lista com valores de `ClientSummary`, filtro "Sem histórico", ordenação por score tratando `null` por último, grade e lista.
- [ ] **Step 2:** Detalhe: cabeçalho com contato e totais, `ScoreCard`, `Timeline`, cobranças por situação, cobrança em lote, edição e exclusão. Remover a escrita de `score` e totais ao abrir a tela.
- [ ] **Step 3:** Novo cliente: formulário com prévia do cartão. Preservar normalização do telefone e limite.
- [ ] **Step 4:** Remover as últimas leituras e escritas de `clients.score`, `total_pago` e `total_atrasado` no dashboard. Conferir com `grep -rnE "total_atrasado|total_pago|\.score\b" src/app/dashboard src/components/screens`. Expected: nenhuma referência às colunas.
- [ ] **Step 5:** No mock, conferir que uma cobrança vencida altera lista, ranking e painel sem abrir o cliente.

### Task 10: Calendário e Inadimplência

**Files:**
- Create: `src/components/screens/calendar-screen.tsx`, `ranking-screen.tsx`
- Modify: `src/app/dashboard/calendar/page.tsx`, `ranking/page.tsx`

- [ ] **Step 1:** Calendário: totais como filtros, mês animado, painel do dia com ações rápidas. Corrigir data de criação para dia local.
- [ ] **Step 2:** Inadimplência: bloco líder com total, pódio dos 3 maiores, faixas 1–15, 16–30 e 31+ dias, ranking expansível com cobrar e pagar.
- [ ] **Step 3:** Conferir no mock, incluindo mês sem eventos e ninguém em atraso.

### Task 11: Relatórios

**Files:**
- Create: `src/components/screens/reports-screen.tsx`
- Modify: `src/app/dashboard/relatorios/page.tsx`

- [ ] **Step 1:** Filtro de período (este mês, 3, 6, 12 meses, ano e intervalo). Indicadores, gráficos, tabelas e exportações usando `resumoPeriodo` e `gerarCsv`. Recebido por data de pagamento.
- [ ] **Step 2:** Baixar os cinco CSVs pelo perfil com dados difíceis e conferir colunas, acentos e valores.

### Task 12: Configurações e Planos

**Files:**
- Create: `src/components/screens/settings-screen.tsx`, `upgrade-screen.tsx`
- Modify: `src/app/dashboard/settings/page.tsx`, `upgrade/page.tsx`, `upgrade/success/page.tsx`

- [ ] **Step 1:** Mover Configurações para o novo visual sem alterar handlers de senha, cancelamento, reembolso e exclusão de conta.
- [ ] **Step 2:** Adicionar a seção Avisos, com leitura e `upsert` em `notification_settings` e estado de indisponível quando a tabela não existir.
- [ ] **Step 3:** Refazer Planos e sucesso usando `lib/ui/pricing.ts`, preservando a chamada de checkout.
- [ ] **Step 4:** Conferir no mock: alterar nome, ligar e desligar avisos, abrir cancelamento e reembolso no Pro, e erro amigável de checkout sem Cakto.

### Task 13: Demonstração sobre as telas reais

**Files:**
- Modify: `src/components/marketing/product-demo.tsx`, `src/components/marketing/demo-data.ts`, `src/app/page.tsx`
- Test: `src/components/marketing/__tests__/demo-data.test.ts`

**Interfaces:**
- Consumes: `DemoWorkspace`, telas das Tasks 7 a 11, `WLink`.

- [ ] **Step 1:** Teste: `demo-data` gera dados com pelo menos um cliente "Sem histórico", um em cada faixa, atrasos, vencimento hoje e 12 meses de pagamentos.
- [ ] **Step 2:** Refazer `demo-data` para passar no teste.
- [ ] **Step 3:** Refazer `ProductDemo`, com a mesma moldura de janela, metas, aviso de dados fictícios, reiniciar e CTA, mas rodando as telas reais sob `DemoWorkspace`, em plano Pro, com carga sob demanda e altura reservada. WhatsApp abre a prévia dentro da janela. Legenda sobre Configurações e Planos.
- [ ] **Step 4:** Conferir no navegador, em 1360px e 375px, as quatro metas, navegação entre todas as telas e modais presos à janela.

### Task 14: Landing fiel ao produto

**Files:**
- Modify: `src/components/marketing/score-explainer.tsx`, `spreadsheet-vs.tsx`, `sections.tsx`, `faq-data.ts`, `pricing.tsx`, `src/lib/ui/pricing.ts`, `src/lib/subscription.ts`, `src/app/privacidade/page.tsx`

- [ ] **Step 1:** Score: critérios, teto e estado "Sem histórico", usando `calcularScore`.
- [ ] **Step 2:** Planilha x VenceJá: linhas e totais calculados de `demo-data` com `resumirClientes` e `calcularPainel`.
- [ ] **Step 3:** Recursos, FAQ e preços: incluir aviso diário, busca, ações rápidas, previsão e explicação da nota. Mostrar os modelos reais de mensagem. Privacidade: citar o e-mail diário e como desligar.
- [ ] **Step 4:** Revisar cada afirmação da landing contra o dashboard e registrar a lista em `docs/superpowers/plans/2026-11-06-auditoria-landing.md`, com o local que comprova cada item.

### Task 15: Verificação final

**Files:**
- Modify: `docs/REDESIGN.md`, `docs/MANUAL.md`

- [ ] **Step 1:** Rodar `npm test`, `npx tsc --noEmit`, `npx eslint src` e `npm run build`. Expected: testes verdes, zero erros de tipo e lint, build concluído.
- [ ] **Step 2:** Percorrer todas as telas em 1360px e 375px, claro e escuro, grátis e Pro, sem erros no console.
- [ ] **Step 3:** Comparar capturas da landing antes e depois, com a landing do backup, e confirmar diferenças só nos locais da seção 9 do spec.
- [ ] **Step 4:** Conferir `prefers-reduced-motion`, navegação por teclado e o console com perfil `mil`.
- [ ] **Step 5:** Atualizar a documentação com a nova arquitetura, os comandos locais e o roteiro para quando decidir publicar.
