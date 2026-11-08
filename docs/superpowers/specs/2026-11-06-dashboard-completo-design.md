# VenceJá: dashboard completo, score novo e landing fiel ao produto

Data: 06/11/2026. Status: aprovado em 06/11/2026.

**Ajustes pedidos na aprovação:** a entrega é só local, sem deploy. O dashboard deve ter mudanças fortes de design e layout, ficar mais parecido com a landing e mais preenchido de informações e funções.

## 1. Intenção

Refazer toda a interface do dashboard para que fique mais completa, mais detalhada e mais animada, com a mesma lógica de design e paleta da landing. Corrigir o cálculo do score. Adicionar as funcionalidades que faltam. Garantir que tudo o que a landing mostra exista de verdade no produto, e que a demonstração seja o próprio dashboard com dados fictícios. O resultado deve estar pronto para produção.

## 2. Objetivos

- As 13 telas do dashboard redesenhadas, no desktop e no celular, nos temas claro e escuro.
- Score correto, sempre atualizado e explicável para o usuário.
- Uma só fonte de regras: o dashboard, a demonstração e o e-mail diário usam os mesmos cálculos.
- A demonstração usa as telas reais do dashboard.
- Nenhuma promessa na landing sem funcionalidade por trás.
- Limites do plano grátis garantidos no banco, não só na interface.
- Testes automáticos para as regras de dinheiro e de score.

## 3. Fora do escopo

- Redesenho visual da landing. Layout, cores e animações ficam como estão. Mudam só a demonstração e os textos ou números que não baterem com o produto.
- Telas de autenticação, e-mails existentes, webhooks da Cakto, checkout e fluxos de cancelamento e reembolso (a tela de plano muda só no visual).
- Envio automático de mensagens pelo WhatsApp. O usuário continua revisando e enviando do próprio número.
- Janela de tempo ou peso por recência no score.
- Ações em lote além da cobrança em lote por cliente, que já existe.
- Bloqueio no servidor para WhatsApp e relatórios: são conveniências sobre os dados do próprio usuário. Só os limites de quantidade passam a ser garantidos no banco.
- Deploy em produção. A entrega é o código pronto, mais o SQL e o passo a passo para você aplicar.

Não pode acontecer: alterar a aparência da landing fora do que está listado, inventar número ou recurso na demonstração, nem perder dados de usuários atuais.

## 4. Abordagem escolhida (A)

| Opção | Como funciona | Compensação |
|---|---|---|
| **A, escolhida** | Camada única de regras em TypeScript. Dashboard e demo usam as mesmas telas, trocando só a fonte de dados. | Exige reconstruir a demo sobre as telas reais. |
| B | O banco calcula score e totais com funções e gatilhos em SQL. | Protege melhor, mas exige SQL manual a cada ajuste e uma cópia da lógica para a demo. |
| C | Corrigir a fórmula onde está e só atualizar a aparência da demo. | Mais rápida, mas a demo volta a divergir. |

## 5. Arquitetura

### 5.1 Camada de regras (`src/lib/domain/`)

Funções puras, sem React nem Supabase, que recebem `hoje` como parâmetro para serem testáveis:

- `charges.ts`: situação da cobrança, saldo em aberto, dias de atraso.
- `score.ts`: score, faixa e detalhamento por critério.
- `clients.ts`: resumo do cliente (score, já pagou, em atraso, a receber, pontualidade, tempo médio de pagamento).
- `metrics.ts`: indicadores do painel, séries mensais, previsão de caixa, ranking de inadimplência, resumos de relatório.
- `csv.ts`: geração de CSV.

Regras únicas de dinheiro:

- **Recebido** é sempre agrupado por data de pagamento.
- **A receber e em atraso** são agrupados por data de vencimento e usam o saldo em aberto (`valor - valor_pago`).
- Isso corrige Relatórios, que hoje agrupa o recebido por vencimento enquanto o painel agrupa por pagamento.

`clients.score`, `clients.total_pago` e `clients.total_atrasado` deixam de ser lidas e escritas. As colunas continuam no banco, sem migração para removê-las. As funções antigas de score em `src/lib/utils/index.ts` saem.

### 5.2 Espaço de trabalho compartilhado

`useWorkspace()` entrega clientes, cobranças, plano, indicadores derivados e ações (`marcarPago`, `criarCobrancas`, `salvarCliente`, `excluirCobranca` e demais). Duas implementações:

- `SupabaseWorkspace`, no layout do dashboard: carrega os dados uma vez, atualiza o cache após cada ação e recarrega ao voltar para a aba. A navegação entre telas fica mais rápida.
- `DemoWorkspace`, na landing: mesmos contratos, em memória, com dados de `demo-data.ts` e botão de reiniciar.

As telas ficam em `src/components/screens/`. Links passam por um componente que navega por rota no dashboard e por estado interno na demo. As páginas em `src/app/dashboard/**` passam a ser finas e só montam a tela. As URLs atuais não mudam.

As telas usam container queries (plugin oficial `@tailwindcss/container-queries`), para o layout responder à largura da janela da demo e não à da página. Modais aceitam um contêiner de portal, para abrir dentro da janela da demo.

### 5.3 Isolamento da landing

Componentes compartilhados com a landing (`GlassPanel`, `Reveal`, `Segmented`, `Button`, `Badge`, `AnimatedNumber`) não mudam de aparência. Novos estilos em `globals.css` e `tailwind.config.ts` são apenas acréscimos. A exceção é `ScoreRing`, que passa a aceitar `null` para "Sem histórico" e só é usado pela demo e pelo dashboard.

A demo é carregada sob demanda (`next/dynamic`, sem SSR) com espaço reservado, para manter a landing estática e sem salto de layout.

## 6. Score novo

**Cobranças que contam:** as pagas e as vencidas em aberto. Cobrança no prazo ou que vence hoje é neutra.

| Critério | Pontos | Cálculo |
|---|---|---|
| Cobranças pagas | 35 | pagas ÷ cobranças que contam |
| Pontualidade | 30 | pagas em dia ÷ pagas |
| Tamanho dos atrasos | 20 | 20 × (1 − atraso médio ÷ 30), mínimo 0. O atraso médio inclui as vencidas em aberto, com dias contados até hoje |
| Valor vencido em aberto | 15 | 15 × (1 − valor vencido em aberto ÷ valor das cobranças que contam) |

**Teto:** com cobrança vencida em aberto há até 30 dias, a nota máxima é 79. Entre 30 e 90 dias, o teto desce de forma linear de 79 até 49. Com 90 dias ou mais, é 49. (Revisado em 08/11/2026: o teto original em degrau passava de 79 para 49 em um único dia e apagava anos de bom histórico.)

**Sem cobranças que contam:** não há nota. O cliente aparece como "Sem histórico", em cor neutra, fora da média e com filtro próprio. As faixas continuam iguais: 80 ou mais "Bom pagador", 50 a 79 "Atenção", até 49 "Risco alto".

**Revisão de 08/11/2026 (pedido do usuário):**

- **Peso por data:** o histórico pago perde metade do peso a cada 180 dias. A dívida vencida em aberto mantém peso integral.
- **Peso por valor:** pontualidade e tamanho dos atrasos são calculados em reais. A taxa de cobranças pagas continua por quantidade, para não duplicar o critério de valor em aberto.
- **Confiança:** com menos de 5 cobranças que contam, a nota é puxada para 70 na proporção n ÷ 5, nos dois sentidos. O teto se aplica depois.

| Situação | Original | Atual |
|---|---|---|
| Sem cobranças | 80 | Sem histórico |
| Primeira cobrança, no prazo | 20 | Sem histórico |
| 1 paga em dia | 100 | 76 (pouco histórico) |
| 5 pagas em dia | 100 | 100 |
| 12 parcelas, a 1ª paga em dia | 54 | 76 (pouco histórico) |
| 1 paga em dia + 1 vencida há 300 dias | 75 | 49 |
| 3 pagas em dia + 1 vencida há 10 dias | 88 | 79 |
| Só 1 vencida há 3 dias | 18 | 60 (pouco histórico) |
| 10 pagas em dia + 1 vencida há 31 dias | 49 (degrau) | 79 |
| 10 pagas sempre com 10 dias de atraso | 63 | 63 |
| 10 em dia de R$ 20 + 1 de R$ 3.000 paga com 30 dias de atraso | 95 | 53 |

Status `parcial`: o fluxo atual não grava esse status, mas o banco permite. Quando existir, conta como em aberto pelo saldo restante.

A nota dos clientes atuais muda assim que o código entrar no ar, sem migração.

## 7. Funcionalidades novas

Sem mudança no banco:

1. **Ações rápidas nas listas:** marcar como pago, com data e opção de valor parcial, e cobrar no WhatsApp. No grátis, o botão de WhatsApp leva a Planos.
2. **"Por que esta nota":** detalhamento do score na tela do cliente, critério por critério.
3. **Painel mais completo:** comparação com o mês anterior, taxa de recebimento, tempo médio de pagamento e previsão de caixa dos próximos 30 dias.
4. **Busca global:** Cmd/Ctrl+K ou botão de busca, com clientes e cobranças.
5. **Histórico do cliente:** linha do tempo de cobranças e pagamentos.
6. **Relatórios por período:** filtro de intervalo em todos os resumos.
7. **CSV correto:** separador `;` e BOM para abrir no Excel em português, com escape de vírgulas e aspas. Hoje um nome com vírgula quebra a coluna.

Com SQL rodado por você (`supabase/migrations/20261106_dashboard_completo.sql`):

8. **Aviso diário por e-mail:** tabela `notification_settings` (`user_id`, `daily_email`, `last_sent_on`) com RLS, rota `/api/cron/daily-digest` protegida por `CRON_SECRET` e agendamento em `vercel.json` às 11:00 UTC (08:00 em Brasília), usando a data de São Paulo. Envia só quando há cobrança que vence hoje ou que venceu ontem sem pagamento, com o total em atraso como resumo. `last_sent_on` impede envio duplicado. Liga e desliga em Configurações › Avisos.
9. **Limites no banco:** gatilhos em `clients` e `charges` bloqueiam novos registros acima de 3 clientes e 10 cobranças para quem não tem Pro válido, com a mesma regra de `hasPremiumAccess`. Dados existentes acima do limite ficam intactos. A interface mostra a mensagem atual de limite. A `service_role` não é bloqueada.
10. **Registro de pagamento no servidor:** rota `POST /api/charges/[id]/pay`, autenticada, que cuida do pagamento total e parcial. Isso permite criar o restante de um pagamento parcial mesmo para quem está no limite, e mantém a proteção atual contra pagamento duplicado.

O app precisa continuar funcionando se o código subir antes do SQL: sem a tabela, a seção de avisos mostra indisponibilidade e o envio apenas não acontece.

## 8. Telas

Linguagem visual herdada da landing: títulos em Bricolage com entrada palavra por palavra, um elemento líder em `glass-brand` por tela, vidro em `glass` e `glass-strong`, marca d'água em ícone ou logo, pontos de `dot-grid`, cantos generosos, hierarquia clara em vez de fileiras de cartões iguais.

| Tela | O que muda |
|---|---|
| Shell | Barra lateral refinada, busca global, contador de atrasos no menu, barra inferior no celular |
| Painel | Bloco líder com recebido no mês e progresso frente ao previsto; ações de hoje; indicadores com variação; atenção e vencimentos com ações rápidas; gráfico de 12 meses; previsão de 30 dias; distribuição do score; atividade; quem mais deve |
| Cobranças | Resumo por situação, ações rápidas, filtros, tabela e cartões |
| Nova cobrança | Mantém resumo ao vivo, parcelas e detecção de duplicidade, com prévia em formato de recibo |
| Detalhe da cobrança | Recibo, linha do tempo, prévia da mensagem, cliente com score. Mantém pagamento parcial, edição e exclusão de série |
| Clientes | Cartões com score, filtro "Sem histórico", valores calculados na hora |
| Novo cliente | Formulário com prévia do cartão do cliente |
| Detalhe do cliente | Score com explicação, histórico, cobranças por situação, cobrança em lote |
| Calendário | Totais do mês como filtros, painel do dia com ações rápidas |
| Inadimplência | Pódio dos maiores valores, ranking com faixas de atraso e ação de cobrar |
| Relatórios | Filtro de período, gráficos, tabelas, exportações |
| Configurações | Nova seção Avisos e visual novo. Fluxos existentes preservados linha a linha |
| Planos e sucesso | Visual novo, com os textos vindos de `lib/ui/pricing.ts` |

**Animação:** entrada de títulos e blocos em sequência, números contando, gráficos se desenhando, hover com mola, transição entre abas, linhas animando ao mudar de lista e confirmação animada ao registrar pagamento. Tudo respeita `prefers-reduced-motion`.

## 9. Landing: o que muda

| Local | Mudança |
|---|---|
| Demonstração | Passa a ser o dashboard real, em plano Pro e com dados fictícios: Painel, Cobranças, Clientes, Calendário, Inadimplência e Relatórios, com telas de detalhe e criação. Configurações e Planos ficam fora, e a legenda diz isso |
| Score | Novos critérios, teto e "Sem histórico", usando a mesma função |
| Planilha x VenceJá | Números calculados a partir dos dados da demo. Hoje "A receber R$ 1.590" não bate com as linhas mostradas |
| Recursos, FAQ e preços | Incluem o aviso por e-mail e as funcionalidades novas. O texto sobre o score deixa de dizer que só muda a cada pagamento |
| Mensagens do WhatsApp | Texto neutro no lugar de "tranquilo", e a landing mostra os modelos reais |

"Suporte prioritário" é um compromisso operacional, sem recurso no produto. O texto fica, e a promessa depende de você responder primeiro quem é Pro.

## 10. Qualidade e verificação

- Backup antes de começar: `backup-pre-dashboard-completo.tar.gz`, porque o projeto não está em git.
- Testes com Vitest para `src/lib/domain/`, incluindo todos os casos da seção 6, datas limite e CSV.
- `tsc`, ESLint e `next build` sem erros novos.
- Teste no navegador contra `scripts/mock-supabase.mjs`, ampliado com dados mais ricos, em 1360px e 375px, claro e escuro, grátis e Pro.
- Comparação de capturas da landing antes e depois, fora da demonstração e dos textos listados.

Não dá para validar localmente: Supabase real com RLS e gatilhos, envio pela Resend e agendamento da Vercel. O passo a passo incluirá o teste de cada um após o deploy.

## 11. Quando decidir publicar

Nada disso faz parte da entrega atual, que é só local. O código, o SQL e o roteiro ficam prontos para depois:

1. Rodar a migração no SQL Editor.
2. Criar `CRON_SECRET` na Vercel. A integração segue a documentação vigente do Cron da Vercel.
3. Fazer o deploy e seguir o roteiro de testes em produção.

## 12. Decisões minhas para você conferir

- O aviso diário fica disponível nos dois planos e vem ligado por padrão, com opção de desligar.
- Teto do score em 79 e 49.
- Cliente sem histórico não recebe nota, em vez de nota padrão.
- Colunas antigas de score e totais ficam no banco sem uso.
- WhatsApp e relatórios continuam protegidos só na interface.
- Configurações e Planos ficam fora da demo.

## 13. Decisões deixadas para a implementação

Composição exata de cada tela, intensidade e duração das animações, divisão interna de componentes, dados da demo e seu volume, formato do e-mail diário dentro do padrão dos e-mails existentes.
