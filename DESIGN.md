---
name: AppCasal
description: Calendário, finanças, hábitos e o dia a dia de um casal num só app
colors:
  indigo-primary: "#4f46e5"
  pink-accent: "#ec4899"
  cyan-accent: "#06b6d4"
  cool-mist-bg: "#f4f5fa"
  surface-white: "#ffffff"
  surface-alt: "#f8f9fd"
  hairline-border: "#e4e6ed"
  strong-border: "#c7cbd6"
  ink-text: "#1f2430"
  slate-muted: "#596070"
  success-green: "#16a34a"
  warning-amber: "#d97706"
  danger-red: "#dc2626"
  night-bg: "#0f1115"
  night-surface: "#181b22"
  night-text: "#e7e9ee"
  night-muted: "#9aa0ac"
  person-1-blue: "#2563eb"
  person-2-pink: "#ec4899"
typography:
  headline:
    fontFamily: "Inter, Segoe UI, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
  title:
    fontFamily: "Inter, Segoe UI, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
  body:
    fontFamily: "Inter, Segoe UI, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
  label:
    fontFamily: "Inter, Segoe UI, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
rounded:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.indigo-primary}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "0.6rem 1.1rem"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink-text}"
    rounded: "{rounded.sm}"
    padding: "0.6rem 1.1rem"
  card:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.lg}"
  input:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.ink-text}"
    rounded: "{rounded.sm}"
---

<!-- BASELINE: retrato do sistema visual em 2026-10-16, antes do redesign (docs/redesign-frontend.md, etapa 3). A etapa 3 substitui este arquivo pela nova direção; as seções "Preservar no redesign" são compromissos que a nova direção deve manter. -->

# Design System: AppCasal

## Overview

**Creative North Star: "O Painel Neutro" (ponto de partida a substituir)**

O visual atual é limpo, funcional e **genérico de SaaS**: neutros frios, um indigo de produtividade como destaque, cards brancos com sombra suave e Inter em tudo. Funciona, mas parece qualquer painel de produtividade e tem pouca cara de casal. As telas compartilham os tokens, mas a hierarquia é rasa: títulos, ações e informação secundária disputam o mesmo peso. O carinho do produto aparece só em pontos isolados, sem formar uma linguagem.

A densidade é média. No celular as telas viram pilhas de cards. Cada módulo (Tarefas com Fraunces, Emoções com Nunito, Hábitos com variáveis próprias) acrescentou estilo local, em vez de um sistema comum.

**Key Characteristics:**
- Neutros frios azulados com um destaque saturado escolhido pelo usuário.
- Cards brancos arredondados (18 px) com sombra suave como unidade básica.
- Inter em uma única família, com hierarquia feita só por tamanho e peso.
- Toques afetivos isolados: foto do casal no login, gatinho, tema Miku, coração no hábito.

**Preservar no redesign** (decisão do usuário):
- temas claro e escuro;
- cores de destaque selecionáveis, incluindo Miku e Preto & Verde;
- cor por pessoa;
- os toques fofos.

## Colors

Uma paleta neutra e fria que espera a cor de destaque escolhida pelo usuário para ganhar personalidade.

### Primary
- **Indigo de Produtividade** (#4f46e5): botões principais, item ativo, foco, links. É o padrão "indigo". O usuário pode trocá-lo por um destes temas de cor: rose, blue, green, orange, red, teal, amber, miku ou black-green. No escuro cada tema usa uma versão mais clara, com texto escuro em cima. As variantes de hover, active e light saem de `color-mix` sobre o primário.

### Secondary
- **Rosa Afeto** (#ec4899): segunda cor do gradiente de marca, destaques afetivos.

### Tertiary
- **Ciano Frio** (#06b6d4): terceira cor de apoio, pouco usada.

### Neutral
- **Névoa Fria** (#f4f5fa): fundo da página no claro.
- **Superfície Branca** (#ffffff) e **Superfície Alternativa** (#f8f9fd): cards e campos.
- **Linha Fina** (#e4e6ed) e **Linha Forte** (#c7cbd6): bordas e divisores.
- **Tinta** (#1f2430): texto principal. **Ardósia** (#596070): texto secundário, com ≥ 4,5:1 sobre o fundo.
- Noite: fundo #0f1115, superfície #181b22, texto #e7e9ee, secundário #9aa0ac.

### Semantic
- Sucesso #16a34a, aviso #d97706, perigo #dc2626, cada um com um fundo claro correspondente.

### Named Rules
**The Person Color Rule.** Cada pessoa tem uma cor fixa (azul #2563eb, rosa #ec4899, verde, âmbar, roxo, teal), independente do tema escolhido. É usada no avatar e nos eventos. Ela identifica *quem*, nunca *estado*. Preservar.

**The Chosen Accent Rule.** A cor de destaque é escolha de cada conta e precisa funcionar nos dois temas. Nenhum componente pode depender de um destaque específico.

## Typography

**Fonte de corpo:** Inter (com Segoe UI e system-ui de fallback)
**Exceções locais:** Fraunces em títulos de Tarefas, Nunito em Emoções

**Character:** neutra e eficiente, sem voz própria. A hierarquia vem só de tamanho e peso.

### Hierarchy
- **Headline** (700, 1,75 rem): títulos de página grandes, raros.
- **Title** (600, 1,125 rem): títulos de seção e de card, e o mês do calendário.
- **Body** (400, 0,9375 rem): texto corrido e listas.
- **Label** (600, 0,8125 rem): rótulos de campo, botões e abas.
- **Caption** (0,75 rem): metadados.

## Layout

- **Desktop:** barra lateral fixa de ~260 px (módulos, atalhos, próximos eventos) e conteúdo à direita.
- **Celular** (< 768 px): a lateral vira gaveta e as ações principais viram botão flutuante.
- **Tablet** (820 px): a lateral continua aberta e ocupa ~1/3 da largura.
- **Exceção:** o Financeiro não tem lateral e só oferece "Voltar para o lobby".
- **Lobby:** grade de 14 atalhos com ícone e rótulo.
- **Espaçamento:** a escala padrão do Tailwind. Formulários em coluna única, com pares lado a lado no desktop.

## Elevation & Depth

Híbrido: superfícies brancas sobre fundo levemente azulado, com sombras suaves.

### Shadow Vocabulary
- **Repouso** (`0 1px 2px rgba(16,24,40,.06)`): cards.
- **Elevado** (`0 4px 16px rgba(16,24,40,.1)`): hover de botão e de dia do calendário.
- **Flutuante** (`0 12px 32px rgba(16,24,40,.16)`): modais e botões flutuantes.

## Shapes

Cantos generosos e amigáveis:
- 6 px nos chips;
- 8 px nos botões e campos;
- 12 px nos blocos;
- 18 px nos cards;
- 24 px nas pílulas grandes;
- totalmente redondos nos botões de ícone e no avatar.

Os dias do calendário são cápsulas altas e arredondadas.

## Components

### Buttons
- **Shape:** cantos suaves (8 px).
- **Primary:** fundo do destaque, texto `on-primary` (branco no claro, escuro no escuro). No hover, sobe 1 px e cresce 4 %, com sombra.
- **Secondary:** transparente com borda fina; no hover, a borda e o texto ficam na cor do destaque.
- **Danger:** fundo vermelho.
- **Loading:** o texto some e aparece um spinner centralizado.

### Cards / Containers
- **Corner Style:** 18 px.
- **Background:** branco (claro) ou #181b22 (escuro).
- **Shadow Strategy:** repouso.
- **Border:** linha fina.

### Inputs / Fields
- **Style:** fundo alternativo, cantos de 8 px, select com seta própria.
- **Focus:** contorno de 2 px na cor do destaque.
- **Error:** `aria-invalid` com borda vermelha.
- **Obrigatório:** asterisco vermelho via CSS, fora do texto do rótulo.

### Navigation
- **Lateral:** lista de módulos com ícone; o item ativo fica com fundo cheio na cor do destaque.
- **Abas e toggles:** pílulas arredondadas; o ativo fica preenchido.

### Modal
- Abre em portal no `body`, deixa o fundo `inert` e tem botão de fechar redondo.

## Do's and Don'ts

### Do:
- **Do** manter a cor da pessoa separada da cor de destaque.
- **Do** garantir contraste AA nos dois temas e em todas as cores de destaque.
- **Do** manter alvos de toque ≥ 40 px em telas de toque.
- **Do** tratar os toques fofos (foto do casal, gatinho, Miku, coração, doces) como parte da identidade.

### Don't:
- **Don't** criar estilos locais por módulo (fontes ou variáveis próprias) fora do sistema comum. Foi isso que fragmentou o visual atual.
- **Don't** depender de hover para revelar informação: o uso principal é no toque.
- **Don't** usar o mesmo peso visual para título, ação e informação secundária.
