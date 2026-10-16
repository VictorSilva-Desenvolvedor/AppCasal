---
target: front-end inteiro (calendario-web/frontend/src)
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-10-16T14-06-25Z
slug: calendario-web-frontend-src
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score
| # | Heurística | Nota | Problema-chave |
|---|---|---|---|
| 1 | Visibilidade do status | 2 | Lobby sem estado; sino "2" sem contexto; saldo R$ 0,00 em verde |
| 2 | Correspondência com o mundo real | 3 | "Comodidades", "Natureza da despesa", "Tipo (planejamento futuro)" opacos |
| 3 | Controle e liberdade | 2 | Calendário mobile abre em lista de meses; 3 jeitos de navegar |
| 4 | Consistência | 2 | Título de página com estilo diferente por tela; 3 estilos de chip |
| 5 | Prevenção de erros | 2 | Modal de despesa com 8+ campos sem agrupamento |
| 6 | Reconhecer vs. lembrar | 2 | Eventos truncados "R…" no mês do celular |
| 7 | Flexibilidade e eficiência | 2 | Sem ação rápida no lobby |
| 8 | Estética e minimalismo | 2 | Financeiro mobile com ~12 controles antes do 1º dado; 2 buscas no calendário |
| 9 | Recuperação de erros | 2 | Estados vazios sem ação |
| 10 | Ajuda | 2 | Sem orientação para casal novo |
| Total | | 21/40 | Aceitável (baixo) |

## Design Specificity Verdict
Intercambiável com qualquer SaaS (indigo, cards brancos com sombra, Inter, lobby-launcher 3x5, login template). Caráter só em Emoções (jarra) e no coração de Hábitos. O casal quase não aparece ("Olá, Victor"). Detector: CLI 0; navegador: overused-font (Inter 100%), flat-type-hierarchy (1,7:1), gpt-thin-border-wide-shadow (--shadow-lg, tokens.css:47; 7 no Financeiro, 4 em Hábitos), ai-color-palette (indigo/roxo — destaque do usuário, falso positivo parcial), layout-transition (calendar.css:61, intencional).

## Priority Issues
1. [P1] Lobby é launcher genérico de 14 ícones; virar home do casal (nós dois, emoção do dia, próxima data especial, ações rápidas, módulos com identidade e badges; Convites/Atualizações/Configurações fora da grade). /impeccable layout + bolder
2. [P1] Calendário mobile abre em lista de meses e trunca eventos; abrir no mês/agenda de hoje, pontos por pessoa, seletor de mês no título. /impeccable adapt + layout
3. [P1] Financeiro mobile sobrecarregado; abas numa linha rolável, Finalizar/Importar em menu ⋯, estados vazios com CTA, saldo zero neutro. /impeccable distill + clarify
4. [P2] Modal de despesa longo; valor em destaque, chips de categoria, pago por com cores do casal, "mais opções", salvar fixo. /impeccable distill
5. [P2] Tipografia sem hierarquia nem voz; PageHeader único, escala clara, fonte de título com calor. /impeccable typeset

## Persona Red Flags
Casey: lista de meses; FAB cobre última semana; chips ~32px; sem ação rápida; faixa cinza na borda esquerda (verificar). Jordan: 14 módulos sem começo; Convites perdido; vazio de Hábitos sem CTA. Sam: placeholder de baixo contraste; "R…" sem alternativa; pessoa só por cor; texto cinza sobre gradiente na jarra.

## Minor Observations
Login com vazio excessivo e "Nome" → "Nome de usuário"; "Todos os usuários" → "Nós dois/Victor/Maria"; ícones de Doces e Veículos; "Sem receita" em negrito; olho sem rótulo; datas miúdas no Resumo.

## Questions to Consider
- O que na primeira tela diz que o app é de vocês dois?
- E se a jarra de Emoções fosse a linguagem do app inteiro?
- Resumo da semana como "carta" do casal em vez de contadores?
