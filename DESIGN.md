---
name: AppCasal
description: A vida do casal bordada ponto a ponto, em linho e ponto-cruz.
colors:
  linha-anil: "#2f3a8f"
  linha-anil-clara: "#e4e6f1"
  linha-coral: "#d9433a"
  linha-mostarda: "#e0a21c"
  linho-lilas: "#eee7f1"
  tela-de-bordar: "#faf6fb"
  tela-sombreada: "#f3ecf6"
  fio-de-trama: "#ddd2e4"
  fio-de-contorno: "#b9abc6"
  tinta-de-linha: "#1c1a2b"
  tinta-desbotada: "#534b66"
  folha-sucesso: "#23735b"
  ambar-aviso: "#a35b06"
  vermelho-perigo: "#c0362d"
  noite-fundo: "#16142a"
  noite-tela: "#211e37"
  noite-tinta: "#f0eaf6"
  noite-anil: "#9aa6f5"
  pessoa-azul: "#2563eb"
  pessoa-rosa: "#ec4899"
  pessoa-verde: "#16a34a"
  pessoa-ambar: "#d97706"
  pessoa-violeta: "#7c3aed"
  pessoa-turquesa: "#0d9488"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Nunito Sans, system-ui, sans-serif"
    fontSize: "clamp(2rem, 6.5vw, 2.6rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Bricolage Grotesque, Nunito Sans, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Bricolage Grotesque, Nunito Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Nunito Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Nunito Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
rounded:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "20px"
  xl: "28px"
  full: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.linha-anil}"
    textColor: "{colors.tela-de-bordar}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.65rem 1.15rem"
    height: "42px"
  button-secondary:
    backgroundColor: "{colors.tela-de-bordar}"
    textColor: "{colors.tinta-de-linha}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.65rem 1.15rem"
    height: "42px"
  button-danger:
    backgroundColor: "{colors.vermelho-perigo}"
    textColor: "{colors.tela-de-bordar}"
    rounded: "{rounded.sm}"
    padding: "0.65rem 1.15rem"
    height: "42px"
  card:
    backgroundColor: "{colors.tela-de-bordar}"
    rounded: "{rounded.lg}"
  input:
    backgroundColor: "{colors.tela-de-bordar}"
    textColor: "{colors.tinta-de-linha}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    height: "44px"
---

# Design System: AppCasal

## Overview

**Creative North Star: "Bordado a dois"**

O app é um pano de cozinha que o casal borda junto. O fundo de todas as telas é linho lilás com uma trama de pontos finos; as superfícies onde algo acontece são tela de ponto-cruz (a grade aida); o texto é tinta de linha escura. Cada pessoa tem a sua linha, numa cor fixa, e cada dia feito vira um X bordado nessa cor. Quando os dois fizeram, os dois fios se cruzam no mesmo ponto.

A densidade é de casa, não de painel: poucos blocos, títulos grandes de pôster, ações ao alcance do polegar. O material carrega a identidade (linho, aida, pesponto tracejado, bastidor de madeira) e a cor de destaque fica guardada para o que está ativo agora. Os toques fofos (emoji de humor, gatinho no bastidor do login, coração no dia do namoro) fazem parte do mundo e são preservados.

O mundo recusa o painel genérico de SaaS: cards brancos por célula, indigo de produtividade, uma fonte diferente por módulo, faixas laterais coloridas.

**Key Characteristics:**
- Linho lilás com trama de pontos como fundo (claro) e tecido azul-noite (escuro).
- Tela de ponto-cruz como superfície do calendário, do bastidor e da semana de hábitos.
- Pesponto tracejado como assinatura, só nas superfícies de destaque.
- Ponto-cruz como a marca de "feito", na cor de quem fez.
- Bricolage Grotesque nos títulos, Nunito Sans no corpo, no app inteiro.
- Uma única animação autoral: o ponto sendo bordado.

## Colors

Neutros lilases de tecido, uma linha de destaque trocável e uma paleta fixa de linhas por pessoa.

### Primary
- **Linha Anil** (#2f3a8f): o destaque padrão. Botão cheio, aba e item ativos, foco, dia de hoje. No escuro vira **Anil Noturno** (#9aa6f5) com tinta escura por cima. Os temas de cor (`data-color-theme`) trocam só esta linha: rosa, azul, verde, laranja, vermelho, turquesa, âmbar, **Miku** (turquesa profundo #0b716c como ação, com fundo e superfícies próprios em água-marinha; o turquesa claro #4dd4cd fica só nos gradientes e no escuro) e **Preto & Verde** (sempre escuro, verde neon #39ff6a). Temas claros demais para texto branco usam tinta escura (#14171c) no texto sobre o destaque.
- **Anil Clarinho** (mistura de 12% da linha com branco): fundo de item selecionado e de pills.

### Secondary
- **Linha Coral** (#d9433a): segunda linha do gradiente da marca e detalhes decorativos.

### Tertiary
- **Linha Mostarda** (#e0a21c): terceira linha do gradiente da marca.

### Neutral
- **Linho Lilás**: fundo do app, sempre sob a trama de pontos (8px).
- **Tela de Bordar**: superfície de cards, campos, modais e do pano do calendário.
- **Tela Sombreada**: superfície alternativa, hover de ícone, fundo de grupos.
- **Fio de Trama**: bordas de repouso.
- **Fio de Contorno**: borda de botão secundário e campos.
- **Tinta de Linha**: texto principal.
- **Tinta Desbotada**: texto secundário, ≥ 4,5:1 sobre fundo e superfície.
- **Noite** (fundo, tela, tinta): o mesmo tecido no modo escuro, com linhas claras.
- **Semânticas** Folha, Âmbar e Vermelho, cada uma com fundo claro próprio: pago, vencendo, atrasado e ações destrutivas.
- **Linhas das pessoas** (azul, rosa, verde, âmbar, violeta, turquesa): fixas, independem do tema de cor; espelhadas em `PERSON_COLOR_HEX` (calendarUtils.js), que calcula a tinta legível sobre elas.

### Named Rules
**The Linha Ativa Rule.** A linha de destaque só borda o que está ativo agora: a aba atual, o botão principal, o foco, o dia de hoje. Nunca decoração, nunca fundo de seção.

**The Linha de Quem Rule.** A cor de pessoa diz quem, nunca estado. Status usa as semânticas; destaque usa a linha ativa; pessoa usa a sua linha.

**The Dois Temas Rule.** Toda superfície funciona no claro e no escuro e em todos os temas de cor (incluindo Miku e Preto & Verde), com contraste AA para texto e ícones de ação.

## Typography

**Display Font:** Bricolage Grotesque (com Nunito Sans, system-ui)
**Body Font:** Nunito Sans (com Segoe UI, system-ui)

**Character:** Bricolage dá títulos encorpados, de etiqueta bordada; Nunito Sans é redonda e amigável no corpo.

### Hierarchy
- **Display** (800, clamp(2rem, 6.5vw, 2.6rem), 1.02): o título de página, um só para todas as telas ("Sexta, 16", "Financeiro", "Resumo da semana"), com subtítulo em corpo logo abaixo.
- **Headline** (700, 1.75rem, 1.1): títulos de seção ("Hoje", "Bordar agora", "A casa").
- **Title** (700, 1.125rem, 1.1): títulos de card e modal, mês do bastidor.
- **Body** (400, 0.9375rem): texto corrido e listas.
- **Label** (700, 0.8125rem): botões, abas, rótulos de campo, chips de pessoa.

### Named Rules
**The Uma Voz Rule.** Um único par de fontes e um único título de página para o app inteiro. Nenhum módulo ganha fonte ou escala própria.

## Layout

Coluna única no celular com gutter de ~20px; a partir de 640px e 768px os grids de atalhos e de conteúdo abrem em mais colunas e a navegação vira lateral rolável. O lobby segue a ordem: o casal no topo, o título do dia, o bastidor com o mês, o card "Hoje", as ações rápidas ("Bordar agora") e a casa (atalhos em grade de duas colunas). O calendário do mês é um pano contínuo de aida: as células são a própria grade do tecido, não cartões separados. Relatórios ficam numa única superfície, com as barras como fileiras de pontos.

**The Alcance do Polegar Rule.** Todo alvo de toque tem pelo menos 40px (botões 42px, campos e itens de lista 44px; botões de ícone ganham 40px em `pointer: coarse`).

## Elevation & Depth

Tecido levantado: sombras com deslocamento vertical e desfoque largo, sempre na cor da tinta, nunca halo colorido. A maior parte da profundidade vem do material (aida sobre linho, bastidor de madeira), não de camadas empilhadas.

### Shadow Vocabulary
- **Repouso** (`box-shadow: 0 1px 2px rgba(28,26,43,.08)`): cards; hover do botão secundário.
- **Levantado** (`box-shadow: 0 8px 20px -8px rgba(28,26,43,.28)`): hover do botão cheio, bastidor.
- **Flutuante** (`box-shadow: 0 20px 40px -16px rgba(28,26,43,.38)`): modais e menus.

## Shapes

Cantos macios de pano (cards 20px, botões e campos 10px, modais até 28px), círculos para avatares, swatches e o bastidor. O pesponto é um contorno tracejado de 1,5px desenhado 5 a 6px para dentro da borda. O ponto-cruz é um X de duas linhas cruzadas numa célula de aida de 22px.

**The Pesponto Raro Rule.** O pesponto tracejado aparece só em superfícies de destaque: o card "Hoje", a carta da semana, as boas-vindas, os modais e o botão cheio. Card comum leva borda simples.

## Components

### Buttons
- **Shape:** cantos macios (10px), altura mínima 42px, peso 700.
- **Primary:** retalho cheio na linha ativa com pesponto tracejado por dentro (texto a 55%, 5px para dentro). Hover escurece 15%, levanta 1px e ganha a sombra levantada.
- **Secondary:** tela de bordar com borda simples de 1,5px em fio de contorno; hover troca borda e texto para a linha ativa. Sem pesponto.
- **Danger:** como o primário, em vermelho.

### Chips
- **Chip de pessoa:** pílula cheia na cor da pessoa com tinta legível calculada (ex.: "Victor" e "Maria" no card Hoje).

### Cards / Containers
- **Corner Style:** 20px.
- **Background:** tela de bordar sobre o linho.
- **Shadow Strategy:** repouso.
- **Border:** 1px em fio de trama; pesponto só na variante destacada.

### Inputs / Fields
- **Style:** tela de bordar, borda em fio de contorno, cantos de 10px, altura 44px; seta de select desenhada na tinta desbotada.
- **Focus:** contorno na linha ativa.
- Campos raros ficam recolhidos em "Mais opções".

### Navigation
- Abas e itens de lateral em label; o ativo leva a linha de destaque, os demais tinta desbotada. No celular, atalhos da casa em grade de duas colunas com ícone num círculo de pesponto.

### Bastidor e ponto-cruz (signature)
O mês do lobby mora num bastidor redondo de madeira (aro marrom com parafuso) sobre aida. Cada dia feito é um X na cor de quem fez; quando os dois fizeram, um fio de cada cor se cruza. Hoje tem contorno tracejado na linha ativa; o dia do namoro ganha um coração. A semana dos hábitos repete a mesma gramática, e o login põe um gatinho no bastidor.

**The Ponto Feito Rule.** "Feito" se marca com ponto-cruz na cor da pessoa, cruzado quando os dois fizeram. Não usar check verde nem barra de progresso genérica para isso.

**The Agulha Única Rule.** A única animação autoral é o ponto sendo bordado: cada perna do X se revela em 0,32s, a segunda 0,18s depois. Nada mais ganha coreografia própria, e com `prefers-reduced-motion` tudo para.

## Do's and Don'ts

### Do:
- **Do** pôr toda tela sobre o linho com trama e usar a tela de bordar como superfície.
- **Do** reservar a linha de destaque para o que está ativo (The Linha Ativa Rule).
- **Do** usar a cor da pessoa só para identificar quem (The Linha de Quem Rule).
- **Do** marcar "feito" com ponto-cruz e animá-lo com o ponto sendo bordado.
- **Do** testar no claro, no escuro, em Miku e em Preto & Verde, com contraste AA.
- **Do** manter alvos de toque ≥ 40px.
- **Do** preservar os toques fofos (emoji de humor, gatinho, coração do namoro).

### Don't:
- **Don't** usar borda lateral colorida grossa em cards.
- **Don't** fazer cards brancos genéricos por célula; o calendário é um pano contínuo.
- **Don't** colocar pesponto em todo card (The Pesponto Raro Rule).
- **Don't** dar fonte ou escala de título própria a um módulo.
- **Don't** usar kicker em caixa-alta espaçada acima dos títulos.
- **Don't** criar uma segunda animação decorativa além do ponto bordado.
