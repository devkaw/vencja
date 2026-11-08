# SDD ledger — plan: docs/superpowers/plans/2026-11-06-dashboard-completo.md

Ruling: projeto não é repositório git, então sem worktree, commits nem scripts task-start/task-done — o ponto de restauração é backup-pre-dashboard-completo.tar.gz — custo se errado: revisão por diff exige comparar com o backup.
Pre-flight: Task 4 consome Tasks 1-3 (tipos ScoreResult, ClientSummary); Tasks 7-13 consomem Workspace e kit. Sem conflitos encontrados.
Task 1: complete (tests: npx vitest run)
Task 2: complete (tests: npx vitest run)
Ruling: valor_total no parcial segue a lógica antiga; pagas sem data_pagamento contam como em dia — não há evidência de atraso — custo: nota levemente alta em dados antigos.
Ruling: CSV usa inteiros sem decimais e fracionários com 2 casas, em vez de 2 casas para todo número — contagens não devem virar 1,00 — custo: valores redondos saem sem ,00.
Task 3: complete (tests: npx vitest run → 44 passed; rotas ainda serão exercitadas no navegador)
Task 4: complete (tests: npx vitest run → 48 passed). Nota: demo-store foi escrito no mesmo comando do teste, então a falha vermelha não foi observada.
Task 5-12: complete (tests: npx vitest run → 52 passed; fluxos no navegador com Playwright: pagamento, clique duplo = 1 pagamento, parcial no limite, 3 parcelas, duplicidade, busca, 375px sem rolagem lateral, escuro, vazio, 1000 cobranças em 359ms).
Task 13-14: complete (demo roda as telas reais; modal preso à janela; metas funcionam).
Ruling: Configurações e Planos ficaram em src/app/dashboard, não em components/screens — não entram na demo e assim os handlers existentes não foram tocados — custo: menos reuso.
Ruling: Relatórios no grátis mostra convite ao Pro em vez de redirecionar — explica o que falta — custo: nenhum dado exposto.
Ruling: servidores locais de terceiros em :3000 e :54321 não puderam ser encerrados; usados :3100 e :54322, com NEXT_DIST_DIR em next.config.ts e config em .claude/launch.json — custo: uma linha extra de configuração.
Ruling: comparação da landing feita por diff de fontes contra o backup, não por capturas antes/depois — os únicos arquivos alterados são os da seção 9 do spec, mais portal em modal/sheet/tooltip e globals.css idêntico — custo: diferença visual sutil passaria despercebida.
Ruling: ChargeItem usa container nomeado próprio para empilhar em largura estreita — container de página não enxerga colunas estreitas — custo: nenhum.

## Revisão final (correções após o parecer)
Final: fixed I-1 parâmetros de URL lidos do roteador (useSearchParams + Suspense) — testes de regra 63 passando; verificar no navegador.
Final: fixed I-2 janela de pagamento única por tela (PaymentProvider) — não some quando a linha vira paga.
Final: fixed I-3 valor digitado em pt-BR (parseValorBR, testes RED→GREEN) e restante em aberto de volta.
Final: fixed I-4 períodos predefinidos até o fim do mês; linhas mensais recortadas ao intervalo (testes RED→GREEN).
Final: fixed I-5 anos fora de 2000..ano+10 recusados; máximo 120 meses (teste RED→GREEN).
Final: fixed I-6 "Mostrar mais" em clientes e cobranças pagas; cabeçalhos contam a lista inteira.
Final: fixed I-7 falha de rede mantém a tela; redirecionar só com falha de autenticação; cobranças e clientes lidos em páginas de 1000.
Final: fixed I-8 preferências do cron lidas por lote; M-1 upsert grava só user_id e last_sent_on; M-6 GRANT ALL para service_role.
Final: fixed M-2 data inválida rejeitada antes do banco (dataValida, teste RED→GREEN) — a rota responde 422 invalid_date.
Final: fixed M-4 tab e retorno de carro também neutralizados (teste RED→GREEN).
Final: Ruling: M-3 (erros do insert em payments ignorados) mantido como no código antigo — nada lê a tabela além da exclusão de conta — custo: o histórico de pagamentos pode divergir sem aviso.
Final: Ruling: M-5 (data não atualiza à meia-noite com a aba aberta) adiado — o badge usa o relógio real e a tela, a data guardada — custo: lista de vencidos pode ficar um dia atrasada até recarregar.
Verificado no navegador após as correções: "Ver todas" abre o filtro de atraso; Nova cobrança a partir do cliente pré-seleciona o cliente; pagamento total pelo painel mostra a confirmação; valor parcial "100,50" mostra o restante; ano 0002 mostra o aviso; conta com 1040 cobranças lista 1040 (paginação). Build de produção sem erros. Mock corrigido para respeitar offset/limit do PostgREST.

## Check-up geral (07/11/2026)
Corrigido: rota de teste do webhook e página de exemplo do Sentry removidas; cabeçalhos de segurança e CSP; limite de tentativas; senha mínima de 8; nomes escapados nos e-mails; Sentry sem replay e sem PII; @react-email removido.
Adicionado: Termos, Privacidade, Reembolso, Cookies, Exclusão de dados, Licenças, Ajuda; banner de cookies; aceite com 18+ no cadastro; aceite de renovação no checkout; exportação de dados; descadastro em um clique.
Ruling: dados da empresa ficam vazios em src/lib/legal.ts, com check:producao travando o deploy — não se inventa CNPJ — custo: site não pode ir ao ar até preencher.
Ruling: PRAZO_ATENDIMENTO de 2 dias úteis é proposta — o cancelamento é manual na Cakto — custo: promessa pública que precisa ser cumprida.
Ruling: nesta rodada não houve revisor independente; a verificação foi por testes, axe e Playwright na build de produção — custo: mesma autoria da implementação.
Não verificado: banco real (conector recusou a senha) e variáveis da Vercel (leitura negada).

## Revisão do score (08/11/2026)
Achado: na demonstração da landing, 20% dos cliques não mudavam a nota, porque o teto em degrau (79 até 30 dias, 49 depois) travava o resultado; a demo também começava exatamente sobre o teto (base 75, nota 49).
Achado: o teto em degrau fazia 1 dia a mais de atraso custar 30 pontos, e 30 pagas em dia + 1 cobrança de 31 dias virava "Risco alto".
Final: Ruling: teto passa a descer linearmente de 79 (30 dias) a 49 (90 dias) — corrige o degrau sem permitir "Bom pagador" com cobrança vencida em aberto — custo: muda a nota de clientes com atraso entre 31 e 89 dias (sobe até 30 pontos); o quadro da seção 6 do spec segue igual.
Final: faixas 80/50 agora definidas só em faixaScore (score.ts); antes estavam repetidas em 5 arquivos.
Final: demo da landing usa o mesmo componente de detalhamento da tela do cliente (ScoreBreakdown), com pontos por critério e nota do limite; começa em 79 "Atenção".
Verificado: 12 de 12 cliques mudaram nota e pontos; nota na lista = nota no detalhe para os 8 clientes; distribuição da carteira confere.

## Score com data, valor e confiança (08/11/2026, pedido do usuário)
Final: histórico pago perde metade do peso a cada 180 dias; dívida vencida em aberto mantém peso integral.
Final: pontualidade e tamanho dos atrasos pesados por valor; taxa de pagas segue por quantidade para não duplicar o critério de valor em aberto.
Final: com menos de 5 cobranças que contam, a nota é puxada para 70 na proporção n/5; teto aplicado depois.
Ruling: confiança puxa nos dois sentidos — um único atraso pequeno não vira risco alto, uma única cobrança paga não vira 100 — custo: cliente novo com uma dívida de 31 a 89 dias pode ficar em "Atenção".
Ruling: o cartão "Pagas em dia" do cliente continua por quantidade (fato simples), enquanto o critério de pontualidade do score é pesado por valor e data — custo: os dois números podem diferir na mesma tela.
Verificado: 18 de 18 cliques na demo mudaram nota e pontos; lista = detalhe em 8/8 clientes; distribuição confere; 91 testes.
