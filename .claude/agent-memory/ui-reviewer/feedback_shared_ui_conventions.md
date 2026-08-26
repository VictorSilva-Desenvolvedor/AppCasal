---
name: shared-ui-conventions
description: Convenções compartilhadas do AppCasal descobertas na varredura — ARIA de tabs incompleto em 3+ telas, border-left colorido é padrão do projeto, Modal fica montado quando fechado
metadata:
  type: feedback
---

Ao revisar uma tela do AppCasal, estas três coisas **não** são achados daquela tela — são
convenções ou decisões que atravessam o sistema. Reporte como cross-cutting em vez de divergir
uma tela sozinha.

**1. `role="tablist"` + `role="tab"` + `aria-selected` sem `tabpanel`/`aria-controls` — RESOLVIDO
em 2026-08-25.** Estava em `FinanceiroPage`, `HabitosPage` e `TarefasPage`; as três foram migradas
para `role="group"` + `aria-pressed`, que já era o padrão de Calendário/Emoções/Doces.
*Why:* eram grupos de filtro, não abas de conteúdo — sem painel irmão nem navegação por setas.
*How to apply:* se aparecer `role="tablist"` em outra tela, é resquício da migração vanilla→React;
corrija direto para `role="group"` + `aria-pressed`, o padrão já é único no sistema.

**2. `border-left: 4px solid var(--<feature>-color)` em cards é padrão do projeto**, não o
anti-padrão "side-tab" que o detector do impeccable acusa. Aparece em `habitos.css` e
`watchlist.css` carregando a cor escolhida pelo usuário para aquele item.
*Why:* é informação real (identidade do item), não decoração genérica.
*How to apply:* trate como falso-positivo do detector. `hook-admin.mjs ignore-value` escreve
dentro de `.claude/` e é **bloqueado** para este agente — só registre no relatório.

**3. `components/ui/Modal.jsx` fica sempre montado, mesmo fechado** (comentário no arquivo: é de
propósito, pra transição CSS de opacity/visibility). O overlay fechado é `invisible`
(`visibility: hidden`), então não é focável nem aparece na árvore de acessibilidade.
*Why:* replica o comportamento do frontend vanilla original.
*How to apply:* ao inspecionar o DOM via CDP, espere encontrar o conteúdo de **todos** os modais
da tela ao mesmo tempo — isso não é bug. O que era bug (id `modal-title` duplicado) foi corrigido
em 2026-08-25 com `useId()`.

**4. Ícones do sprite (`public/icons.svg` + `components/ui/Icon.jsx`) não aceitam `fill`/`stroke`
por CSS.** Cada `<symbol>` traz `fill="none" stroke="currentColor"` como atributo, e CSS aplicado
no `<svg>`/`.icon` externo não atravessa o `<use>` pra sobrescrever atributo do conteúdo do shadow
tree. Só `color` funciona (via `currentColor` no stroke).
*Why:* na Watchlist isso deixava os corações de avaliação sempre vazios — a nota do casal era
invisível, apesar de salva. Corrigido em 2026-08-25 criando um `icon-heart-filled`
(`fill="currentColor"`) e alternando o `name` do `Icon`.
*How to apply:* qualquer estado "outline/preenchido" precisa de **dois símbolos** no sprite;
se encontrar `.icon { fill: var(--x) }` em algum CSS de feature, é código morto — teste no
navegador antes de acreditar que funciona.

**5. Features com identidade de cor fixa (`--habit-coral` em habitos.css, `--candy-brand` em
doces.css) precisam de uma variante separada pra texto.** Um hex único não consegue servir de
preenchimento (com texto branco por cima) e de texto sobre superfície ao mesmo tempo, e nunca
sobrevive ao modo escuro.
*Why:* em `/app/doces` o rosa `#d4537e` dava 3.9:1 nos dois papéis (branco sobre ele e ele como
texto sobre branco) — falha de AA em ambos.
*How to apply:* separe `--x-brand` (fill, escuro o bastante pro branco passar 4.5:1) de
`--x-brand-text`, e sobrescreva só a variante de texto em `[data-theme='dark'] .x-page,
[data-color-theme='black-green'] .x-page` — black-green é escuro mesmo sem `data-theme='dark'`,
miku não é.

**6. Pendência cross-cutting não resolvida: avatares coloridos por pessoa** (`personColorFor` →
`--color-person-N`) usam `text-on-primary` para as iniciais em várias features. `--color-on-primary`
é calibrado pro `primary` do tema, não pras cores de pessoa, então o contraste das iniciais não é
garantido em nenhum tema. Só reporte; a correção é uma decisão global.

**7. `capitalize` do Tailwind em datas pt-BR é sempre bug.**
`toLocaleDateString('pt-BR', {weekday, day, month})` devolve "terça-feira, 25 de agosto";
`capitalize` sobe TODA palavra e produz "Terça-Feira, 25 De Agosto".
*Why:* em pt-BR só a primeira letra sobe. Encontrado em `.tarefas-date`.
*How to apply:* troque por `inline-block` + `::first-letter { text-transform: uppercase }`
(`::first-letter` não pega em `<span>` inline). Procure `capitalize` nas outras telas com data.

**8. Acentos de feature usados como PREENCHIMENTO precisam de variante `-fill` escura.**
Mesmo raciocínio do item 5, mas aplicado a paletas de várias cores: em `tarefas.css` os quatro
tons (`--tarefas-diaria/semanal/mensal/unica`) serviam ao mesmo tempo de sinalização (ponto do
grupo, traço do anel) e de fundo sob branco (✓ da caixa, + do FAB, rótulo do botão ativo). O
âmbar `#ef9f27` dava 2.2:1 com branco.
*How to apply:* mantenha o tom vivo para sinalização e crie `--x-fill` escuro para os fundos. E
nunca use `color: var(--color-bg)` sobre um fundo de acento FIXO — inverte no modo escuro; use
uma var `--x-fg` própria com `#fff`.

**9. Cada `import` de um módulo CDP que navega no topo reinicia a página.** Um passe funcional
com várias etapas (abrir menu → confirmar diálogo) tem que caber num único script; rodar dois
scripts seguidos recarrega a rota e perde o estado. Some-se a isso o item 3 (Modal montado
mesmo fechado): o botão "Excluir" do `ConfirmDialog` fechado continua no DOM e `.click()` nele
"funciona" sem efeito nenhum — filtre por `visibility !== 'hidden'` antes de clicar.

**10. Erro de rede cru em inglês — RESOLVIDO em 2026-08-25 em `services/api.js`.** Quando o
backend está fora, `fetch` rejeita com "Failed to fetch" e esse texto do navegador chegava cru
aos blocos de erro de todas as telas (`TarefasPage`, `EmocoesPage`, `ResumoPage`...).
*Why:* violava a regra de pt-BR em toda interface, e o `request()` já era o ponto único.
*How to apply:* o `try/catch` em volta do `fetch` traduz para "Sem conexão com o servidor...".
Ao escrever um bloco de erro de tela, o cabeçalho deve ser específico ("Não foi possível carregar
X.") e o detalhe é `err.message` — não repita "Não foi possível" nos dois.

**11. `--color-text-muted` (#6b7280) sobre `--color-bg` (#f4f5fa) dá 4,44:1** — falha AA por
margem mínima em texto pequeno. Só aparece fora dos cards (ex.: `.resumo-date-range` no header da
página, viewport mobile, onde o fundo é `--color-bg` e não `--color-surface`).
*How to apply:* é decisão de token em `tokens.css`, cross-cutting — só reporte. Dentro de card
(`--color-surface`, branco) o mesmo cinza passa.

**12. Input fora de um `.field` fica SEM estilo nenhum.** Em `components.css` o estilo base de
input/textarea/select está escopado em `.field input`, não no elemento. Um `<input>` solto (ex.:
o campo de odômetro em `VehicleMaintenanceTab`) renderiza sem borda, sem fundo e sem padding —
parece texto solto, não campo.
*How to apply:* ao revisar uma tela, procure `<input>` que não esteja dentro de `<Field>`. Ou
envolva em `Field`, ou replique as utilities de `.field input` na classe da feature.

**13. `.btn-secondary` não renderizava borda em NENHUMA tela — corrigido em 2026-08-25.**
`.btn` aplica `border-none` (border-style: none) e `.btn-secondary` adicionava só `border`
(que em Tailwind v4 define apenas a espessura), então o botão secundário do app inteiro aparecia
sem contorno, indistinguível de texto.
*Why:* achado na `/app/veiculos` ("Novo veículo", "Atualizar km", "Checklist..." pareciam labels).
*How to apply:* a correção foi `border-solid` em `.btn-secondary` (`styles/components.css`) — vale
para todas as telas; se algum utility de borda vier depois de `border-none`, cheque o
`border-style` computado no navegador antes de assumir que funciona.

**14. `required` num form que já valida em JS mostra a bolha nativa do navegador, em inglês.**
Confirmado em `/app/atualizacoes`: o `required` do `#update-title` disparava "Please fill out this
field." e a mensagem própria ("Informe um título para o pedido") nunca aparecia.
*Why:* viola pt-BR e transforma o `<p class="error-text">` do formulário em código morto.
*How to apply:* `noValidate` no `<form>` (mantém o `required` para a semântica/ARIA) e deixe a
validação em JS aparecer. Procure `required` em `EventForm`, `WatchlistForm`, formulários de
veículos e financeiro — o padrão se repete.

**15. Kanban só muda de status por drag-and-drop HTML5 — inutilizável no APK Android.**
`hooks/useDragAndDrop.js` só registra `onDragStart/onDragOver/onDrop`; não há nenhum handler de
toque. Confirmado em `/app/atualizacoes` (UpdateBoard) e `/app/watchlist` (WatchlistBoard), que
compartilham o hook. `dragStart` não dispara em toque, então no Capacitor o board vira leitura.
*How to apply:* a correção é uma decisão de produto (um controle alternativo — ex.: mover para a
coluna seguinte/anterior no próprio card, ou um seletor de status) e precisa sair nas duas telas
ao mesmo tempo. Só reporte; não invente o controle numa tela só.

**16. Data de evento aparece um dia antes em TODA a app (não é bug de uma tela).** O backend
salva `Event.date` como `Date`; um formulário que envia `"2026-09-10"` vira
`2026-09-10T00:00:00.000Z`, e todo o frontend faz `new Date(event.date)` — em America/Sao_Paulo
(UTC-3) isso rende `09/09/2026`. Confirmado em 2026-08-25 no card de convite, na sidebar de
"próximos eventos" e no `GlobalSearchResults` ao mesmo tempo.
*How to apply:* é cross-cutting (a correção é normalizar a data em um util único, ex.: cortar o
`YYYY-MM-DD` da string ISO como `AgendaView`/`candyUtils` já fazem com `new Date(y, m-1, d)`).
Não conserte numa tela só — divergir uma tela deixa o app inconsistente consigo mesmo.

**17. `.update-card` (kanban) é reusado por telas que NÃO arrastam.** A classe traz
`cursor-grab` + hover que "levanta" o card. Em `/app/convites` isso prometia arraste que não
existe; corrigido em 2026-08-25 com uma classe irmã `.invite-card` (cursor default, hover neutro)
e cores por status (`data-status='accepted'|'declined'`) em `styles/components.css`.
*How to apply:* ao ver `update-card` fora de `/app/atualizacoes` e `/app/watchlist`, cheque se a
tela realmente arrasta.

**18. Controles nativos (checkbox/radio/select aberto/scrollbar) ignoravam o tema — corrigido em
2026-08-25.** Faltavam duas declarações no sistema inteiro: `color-scheme` (`tokens.css`, `:root`
claro + `[data-theme='dark'], [data-color-theme='black-green']` escuro) e
`accent-color: var(--color-primary)` em `.field input[type=checkbox]/[type=radio]`
(`components.css`). Antes disso todo checkbox marcado saía no azul do sistema, em qualquer um dos
9 temas de cor, e a caixa desmarcada ficava branca no modo escuro.
*How to apply:* ao ver `style={{ width: 'auto' }}` num checkbox, é sintoma de que o `.field input`
genérico (que aplica `w-full` + borda) está vazando para ele — a regra por tipo já resolve.

**19. `--color-primary` de um tema é usado tanto como fundo quanto como TEXTO (`a { color }` em
`base.css`), então um tom claro demais quebra links.** O turquesa da Miku (`#4dd4cd`) dava ~1,8:1
sobre `--color-surface`; trocado em 2026-08-25 por `#0b716c` (com `--color-on-primary: #ffffff`),
que passa 4,5:1 sobre `surface` e sobre `primary-light`. O tom claro original sobrevive em
`--gradient-brand`.
*How to apply:* ao criar/ajustar um tema de cor, valide o `primary` nos três papéis ao mesmo
tempo: fundo (com `on-primary` por cima), texto sobre `surface` e texto sobre `primary-light`.
É a mesma armadilha dos itens 5 e 8, agora no token global.

Ver [[project-ui-sweep]] e [[local-ui-review-setup]].
