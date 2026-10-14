# Alvo: Web

**Ferramenta preferida:** Playwright CLI (`npx playwright`) ou Playwright MCP; alternativa: browser do Claude.

## Setup por agente
- Contexto de navegador **isolado** por agente (sem cookies compartilhados)
- Viewport conforme `device`: `desktop` 1366×768 · `mobile_web` 390×844 · `tablet` 820×1180
- Rede: `low_tech`/`senior` → throttling 3G (`page.route` com delay ou CDP `Network.emulateNetworkConditions`)
- `low_vision` → zoom 150%; `motor` → clicar com offset aleatório de até 8px

## Observação (fast loop)
Prefira árvore de acessibilidade (`snapshot`) a screenshot — mais barato. Screenshot só em travamento/erro.

## Evidências a capturar
- URL + título a cada passo
- Erros de console e respostas HTTP ≥ 400
- Tempo até interação (LCP aproximado)
- Screenshot nos pontos de travamento

## Ações válidas no trace
`goto, click, type, scroll, back, wait, search, abandon, done`
