---
name: local-ui-review-setup
description: Como subir backend/frontend e obter um navegador real nesta máquina para a varredura de UI (portas variam entre sessões, sem Playwright como módulo)
metadata:
  type: reference
---

Setup que funciona nesta máquina para o passe visual real:

- **Cheque as portas antes de assumir qualquer coisa.** Em algumas sessões a porta 3000 está
  ocupada por outro serviço (responde 307 → `/login`); em outras (ex.: 2026-08-25) está livre e o
  `npm run dev` padrão do backend sobe normal em `http://localhost:3000`, com o Vite em 5500 e o
  proxy `/api` funcionando sem nenhum ajuste. Teste `curl /api/health` primeiro.
- Se 3000 estiver ocupada: `PORT=3010 npx nodemon src/server.js` a partir de `calendario-web/backend`
  (o entry é `src/server.js`, não `server.js`).
- **Não crie um `vite.*.tmp.config.js` no repo** para redirecionar o proxy. O `services/api.js` já lê
  `VITE_API_URL`, então basta `VITE_API_URL=http://localhost:3010 npx vite --port 5502`. O backend
  usa `cors()` aberto, então a chamada cross-origin funciona.
- **Rode só UMA instância do Vite por vez.** Duas instâncias no mesmo projeto corrompem
  `node_modules/.vite` e a app renderiza em branco com erros falsos (`Cannot read properties of null`
  em Sidebar/NotificationBell). Mate as antigas (`netstat -ano | grep :55` + `taskkill //PID x //F`)
  e suba com `--force`.
- **Jeito mais rápido de ter navegador real:** `npm i playwright-core` **dentro do diretório de
  scratchpad da sessão** (nunca no repo) e apontar `chromium.launch({ executablePath: ... })` para o
  Chromium já baixado (caminho abaixo). Instala em ~30s, não suja o git nem adiciona dependência ao
  projeto, e dá `page.fill`/`getByRole`/`screenshot` de graça. Apague o `node_modules` do scratchpad
  no fim. Funcionou em 2026-08-25 (/app/atividades).
- **Jeito ainda mais rápido (0s de instalação, confirmado 2026-08-25 em /app/atualizacoes):** o
  Playwright completo já está no cache do npx em
  `C:/Users/victo/AppData/Local/npm-cache/_npx/<hash>/node_modules/playwright` — o `<hash>` muda
  entre sessões (já foi `e41f203b7505f1fb` e `705bc6b22212b352`), então localize com
  `find "$HOME/AppData/Local/npm-cache/_npx" -maxdepth 4 -name playwright -type d`. Basta
  `import { chromium } from 'file:///.../playwright/index.mjs'` num script no scratchpad — nada a
  instalar, nada no git. (`ElementHandle.dragTo` não existe nessa versão; use
  `page.dragAndDrop(src, dst)`.)
- **Playwright não está instalado como módulo no repo**, mas o Chromium está em
  `C:\Users\victo\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe`. Dá para dirigir
  via CDP puro com o `WebSocket` global do Node 22+ (`--headless=new --remote-debugging-port=9333`,
  `/json/list`, `Runtime.evaluate`, `Page.captureScreenshot`), sem instalar dependência. Login:
  injetar `calendario_token` / `calendario_user` no `localStorage` (chaves reais, ver `services/api.js`).
- Login pela API para gerar o token: `POST /api/auth/login` com `{ "name": "Teste", "password": "Teste@123" }`
  — o campo é `name`, não `username` (`username` devolve 400 "Nome e senha são obrigatórios").
- Navegar direto para `http://localhost:5500/app/<rota>` às vezes cai no lobby (`/app`). Depois do
  load, cheque `location.pathname` e, se caiu, clique o tile pelo texto no lobby antes de medir.
- Trocar tema no CDP: `document.documentElement.dataset.theme = 'dark'` e
  `setAttribute('data-color-theme', 'miku')` **depois** do render — o app sobrescreve no mount.
- `npx vite build` é um bom smoke test de sintaxe/import antes do passe visual e não suja o git
  (o `dist/` é ignorado).

Ver [[project_ui_sweep]] e [[test_user_convention]].
