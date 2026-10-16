# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Também é empacotado como app Android via Capacitor (`calendario-web/frontend/android`). É o mesmo site num WebView, então a linguagem de design é web, não nativa Android.

## Users

Casais que organizam a vida a dois no mesmo lugar. O app nasceu para o casal dos criadores, que continua sendo o primeiro usuário. A direção agora é servir bem **qualquer casal** que se cadastrar.

- **Situação típica:** no celular, em momentos curtos do dia (marcar um compromisso, lançar uma conta, fazer o check-in de um hábito, registrar como se sente).
- **Planejamento mais longo:** acontece às vezes no computador (ex.: fechar o mês no financeiro).
- **Duas pessoas, papéis iguais:** cada uma tem conta própria, e o casal compartilha um espaço (`team`). Uma conta nova começa sozinha, num espaço próprio (`solo-<id>`), até convidar o parceiro.

## Product Purpose

Juntar num só app o que um casal hoje espalha em vários: agenda, dinheiro, hábitos, tarefas, humor, filmes/séries, fotos e pequenas brincadeiras do dia a dia.

Sucesso é o casal abrir o app todo dia por hábito, conseguir fazer as ações rápidas em poucos toques e sentir que o app é "deles".

## Positioning

Não é um calendário, um app de finanças ou um rastreador de hábitos genérico com um modo "compartilhar". Cada módulo é desenhado para **duas pessoas ao mesmo tempo**:
- hábitos sincronizados, alternados ou espelhados entre os dois;
- despesas com "pago por" e reembolso entre o casal;
- emoções do dia de cada um;
- watchlist a dois;
- ranking de doces;
- resumo da semana do casal.

## Operating Context

- **Uso principal:** celular (app Android e navegador mobile, ~390 px). Também no tablet (~820 px) e no desktop.
- **Notificações:**
  - lembretes de evento (D-5/D-3/D-1) por WhatsApp e push;
  - lembretes de hábito;
  - avisos quando o parceiro faz algo.
- **Rituais:** check-in diário de hábitos, fechamento mensal do financeiro ("Finalizar mês"), importação da planilha de orçamento, datas especiais do casal (aniversário de namoro).
- **Idioma:** português do Brasil, sempre.

## Capabilities and Constraints

**Módulos, todos com o mesmo peso** (não existe um módulo principal):
- Calendário;
- Financeiro: resumo, pagar contas, lançamentos, carteira, objetivos, comodidades, simulação;
- Hábitos;
- Resumo da Semana;
- Emoções do Dia;
- Watchlist a Dois;
- Doces;
- Tarefas (kanban);
- Veículos;
- Galeria;
- Atividades;
- Convites;
- Atualizações;
- Configurações.

**Stack** (front e back):
- **Frontend:** React 19 + Vite + Tailwind v4 (`calendario-web/frontend`). Os tokens de design ficam em `src/styles/tokens.css`.
- **Backend:** Express 5 + Mongoose + JWT (`calendario-web/backend`). Deploy na Vercel.

**Restrições:**
- **Temas:** claro e escuro, mais 10 cores de destaque (indigo, rose, blue, green, orange, red, teal, amber, miku, black-green) e plano de fundo por URL. São preferências **por conta**.
- **Cor da pessoa:** cada pessoa tem uma cor própria, usada no avatar e nos eventos. É diferente da cor de destaque.
- **Login por nome de usuário**, não por e-mail.

**Em aberto** (pedidos recorrentes dos testes com usuários sintéticos, ainda não decididos):
- horário no evento;
- formulários mais curtos;
- menu lateral também no Financeiro;
- onboarding e convite ao parceiro depois do cadastro.

## Brand Commitments

- **Nome:** AppCasal.
- **Personalidade íntima e brincalhona.** Exemplos já existentes:
  - foto do casal no login;
  - fundo de gatinho;
  - tema "Hatsune Miku";
  - módulo de doces;
  - coração quando os dois completam o hábito.
- **Textos** diretos, em segunda pessoa e com "vocês" para o casal.

## Evidence on Hand

- Screenshots atuais de todas as telas em `docs/screenshots/`.
- Relatórios de 8 rodadas de teste com 12 personas sintéticas em `docs/swarm/`. A R8 teve 12/12 de sucesso e facilidade 3,83/5, com a lista de pedidos recorrentes.
- Conta de teste isolada em produção: `Teste` / `Teste@123`.
- Não há depoimentos, números de usuários nem métricas de uso reais. Não inventar.

## Product Principles

1. **Feito para dois.** Toda tela deve deixar claro o que é meu, o que é do parceiro e o que é nosso.
2. **Rápido no celular.** As ações diárias (check-in, lançar conta, marcar compromisso) têm de caber em poucos toques, com o avançado recolhido.
3. **Todos os módulos importam.** Nenhuma área é "secundária". A navegação dá acesso igual a todas.
4. **Um casal novo entende sozinho.** Sem depender de quem criou o app para explicar; o convite ao parceiro faz parte do caminho.
5. **Carinho sem atrapalhar.** A personalidade aparece nos detalhes, nunca à custa de clareza ou velocidade.

## Accessibility & Inclusion

- Meta mínima: WCAG 2.1 AA.
  - Contraste de texto ≥ 4,5:1 nos dois temas.
  - Alvos de toque ≥ 40 px no celular.
  - Foco visível.
  - Nomes acessíveis em botões só com ícone.
- Respeitar `prefers-reduced-motion`.
- Funcionar em 390 px sem rolagem horizontal.
