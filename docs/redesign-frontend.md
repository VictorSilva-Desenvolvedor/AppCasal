# Redesign do front-end: ordem de execução

Plano para refazer o front-end inteiro do AppCasal com a skill **impeccable** (`.claude/skills/impeccable`).
Siga as etapas em ordem. Cada etapa diz qual comando rodar, sobre quais telas, e o que precisa existir ao terminar.

> Regras que valem em todas as etapas
> - Backend local só com `MONGO_URI=mongodb://127.0.0.1:27999/swarm`. O `.env` aponta para o Atlas de produção.
> - O hermes-agent disputa a porta 3000. Para ver o app rodando, suba o backend em outra porta (ex.: 3100) e ajuste o proxy do Vite.
> - Commits sem co-autoria (sem `Co-Authored-By`).
> - Ao fim de cada etapa: `npx vitest run` e `npx vite build` no frontend, commit e push.

## Telas do sistema

| Grupo | Rotas |
|---|---|
| Entrada | `/login`, `/register` |
| Núcleo | `/app` (lobby), `/app/calendario`, `/app/financeiro`, `/app/habitos` |
| Casal | `/app/resumo`, `/app/emocoes`, `/app/watchlist`, `/app/doces`, `/app/tarefas`, `/app/galeria` |
| Utilidades | `/app/veiculos`, `/app/atividades`, `/app/convites`, `/app/atualizacoes`, `/app/configuracoes` |

As etapas 4 a 6 passam primeiro pelo **Núcleo** (onde está o uso real), depois **Entrada**, **Casal** e **Utilidades**.

---

## 1. Contexto

- [x] `/impeccable init`: entrevista curta e gera o `PRODUCT.md`. Ela cobre:
  - quem usa (o casal; uso diário no celular);
  - objetivo de cada área;
  - tom desejado (ex.: aconchegante, divertido, íntimo);
  - referências visuais de que vocês gostam e o que não querem.
- [x] `/impeccable document`: lê o código atual (`styles/tokens.css`, temas, `components/ui`) e gera o `DESIGN.md` com o sistema visual que existe hoje.

**Pronto quando:** `PRODUCT.md` e `DESIGN.md` existem na raiz do projeto.

## 2. Diagnóstico

- [x] `/impeccable critique` em cada tela do Núcleo: lobby, calendário, financeiro, hábitos.
- [x] `/impeccable critique` em uma tela de cada grupo restante: login, resumo, configurações.
- [x] Juntar as notas e os problemas P0/P1 numa lista única. Ela é o backlog das etapas seguintes.
- [x] Incluir no backlog os pedidos recorrentes do swarm (`docs/swarm/2026-10-15-round8.md`):
  - horário no evento;
  - formulários enxutos;
  - menu no Financeiro;
  - onboarding e convite ao parceiro;
  - ícones com texto;
  - check-in em um toque.

**Pronto quando:** existe uma lista priorizada do que está pobre, confuso ou sem hierarquia, tela por tela.

## 3. Direção visual (redesign)

- [ ] Rodar o fluxo de nova direção do impeccable (`reference/new-work.md`) para escolher o **mundo visual** novo:
  - paleta;
  - tipografia;
  - formas, superfícies e materiais;
  - densidade;
  - estilo de ícones e imagens.
- [ ] Revisar e aprovar a direção antes de codar. Ela deve funcionar nos temas claro e escuro e nas cores de destaque existentes.
- [ ] Reescrever o `DESIGN.md` com a nova direção e atualizar `tokens.css` (cores, raios, sombras, fontes, espaçamentos) como fonte única.
- [ ] Atualizar os componentes base em `components/ui`: Button, Field, Modal, Card, Pill, IconButton, Toast, Tabs.

**Pronto quando:** tokens e componentes base refletem a nova direção, e o app inteiro já muda de cara só por isso.

## 4. Elevar o visual, tela por tela

Para cada tela, na ordem dos grupos:

- [ ] `/impeccable layout <tela>`: estrutura, ritmo, espaçamento, hierarquia. O lobby deixa de ser só uma lista de 14 links.
- [ ] `/impeccable typeset <tela>`: títulos, números e textos secundários com hierarquia clara.
- [ ] `/impeccable colorize <tela>`: cor com intenção (estados, categorias, casal × individual).
- [ ] `/impeccable bolder <tela>`: só onde ainda estiver tímido depois dos três acima.

**Pronto quando:** todas as telas usam a nova direção, sem resto do visual antigo.

## 5. Experiência

- [ ] `/impeccable distill`: enxugar os formulários.
  - **Novo evento:** título, data e **horário** à vista; o resto em "mais opções".
  - **Nova despesa:** descrição, valor, data e categoria; Natureza, Tipo, Valor já pago e Compartilhado em "mais opções".
  - **Novo hábito:** nome, emoji e tipo simples; as abas avançadas recolhidas.
- [ ] `/impeccable onboard`:
  - primeiro uso depois do cadastro;
  - convite ao parceiro;
  - estados vazios úteis (Financeiro zerado, calendário sem eventos, hábitos vazios);
  - lobby com resumo do dia.
- [ ] `/impeccable clarify`: textos, rótulos e mensagens de erro (ex.: explicar "Pendente" × "Valor já pago").
- [ ] `/impeccable adapt`: celular (390 px), tablet (820 px) e desktop.
  - Navegação igual em todas as telas, inclusive o Financeiro.
  - Calendário do celular abrindo numa grade útil.
  - Título do evento legível no mês.

**Pronto quando:** os fluxos principais (marcar compromisso, lançar conta, criar hábito e fazer check-in) ficaram mais curtos e claros.

## 6. Personalidade

- [ ] `/impeccable animate`: microinterações com propósito.
  - check-in do hábito;
  - salvar e excluir;
  - troca de mês e de aba;
  - abertura de modal.

  Respeitar `prefers-reduced-motion`.
- [ ] `/impeccable delight`: toques memoráveis de app de casal (ex.: momento quando os dois completam o hábito, aniversário de namoro, sequências).

**Pronto quando:** o app tem identidade própria, sem virar enfeite que atrapalha o uso.

## 7. Fechamento

- [ ] `/impeccable audit`: acessibilidade (contraste AA, foco, leitores de tela, toque ≥ 40 px), desempenho e responsividade, nas telas do Núcleo e de Entrada.
- [ ] `/impeccable harden`: erros, carregamento e casos-limite (sem conexão, listas longas, textos grandes).
- [ ] `/impeccable polish`: acabamento final em todas as telas.
- [ ] Rodar o detector: `node .claude/skills/impeccable/scripts/detect.mjs --json calendario-web/frontend/src`.
- [ ] Rodar uma rodada do **swarm** (`docs/swarm/README.md`) para confirmar que o app ficou mais bonito **sem** ficar mais difícil. Comparar com a R8 (12/12, facilidade 3,83).

**Pronto quando:**
- o swarm fica com 12/12 e facilidade ≥ 3,83, sem defeito novo;
- o detector não aponta nada grave;
- testes e build passam.

---

## Registro de andamento

| Etapa | Status | Commit | Observações |
|---|---|---|---|
| 1. Contexto | concluída | (este commit) | PRODUCT.md + DESIGN.md (baseline "genérico de SaaS"); manter temas claro/escuro, cores de destaque, cor por pessoa e toques fofos |
| 2. Diagnóstico | concluída | (este commit) | critique 21/40 (dual-agent), 3 P1: lobby launcher, calendário mobile, financeiro mobile; decisões: tom aconchegante e íntimo, redesign completo, começar pelo lobby. Snapshot em `.impeccable/critique/` |
| 3. Direção visual | base aplicada | (este commit) | mundo **Bordado a dois** (sorteio 63b87b82; protótipo em run/mock): tokens (linho/tecido noite, linha anil, pesponto, texturas), Bricolage Grotesque + Nunito Sans, componentes base. DESIGN.md novo será escrito no fim do build |
| 4. Visual tela por tela | em andamento | | Lobby → casa do casal ✅; Calendário mobile ✅ (abre no mês, pontos por evento, filtros recolhidos); Financeiro mobile ✅ (topo enxuto, menu Mais, abas numa linha, estado vazio, zero neutro) |
| 5. Experiência | pendente | | |
| 6. Personalidade | pendente | | |
| 7. Fechamento | pendente | | |
