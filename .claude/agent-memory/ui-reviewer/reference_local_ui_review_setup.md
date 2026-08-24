---
name: local-ui-review-setup
description: Como subir backend/frontend e obter um navegador real nesta máquina para a varredura de UI (porta 3000 ocupada, sem Playwright instalado)
metadata:
  type: reference
---

Setup que funciona nesta máquina para o passe visual real:

- **A porta 3000 está ocupada** por outro serviço (responde 307 → `/login`, não é o backend do AppCasal). Suba o backend em outra porta: `PORT=3010 npx nodemon src/server.js` a partir de `calendario-web/backend` (o entry é `src/server.js`, não `server.js`).
- **Não crie um `vite.*.tmp.config.js` no repo** para redirecionar o proxy. O `services/api.js` já lê `VITE_API_URL`, então basta `VITE_API_URL=http://localhost:3010 npx vite --port 5502`. O backend usa `cors()` aberto, então a chamada cross-origin funciona.
- **Rode só UMA instância do Vite por vez.** Duas instâncias no mesmo projeto corrompem `node_modules/.vite` e a app renderiza em branco com erros falsos (`Cannot read properties of null` em Sidebar/NotificationBell). Mate as antigas (`netstat -ano | grep :55` + `taskkill //PID x //F`) e suba com `--force`.
- **Playwright não está instalado como módulo**, mas os binários estão em `C:\Users\victo\AppData\Local\ms-playwright\chromium_headless_shell-1234\`. Dá para dirigir via CDP puro com o `WebSocket` global do Node 22+ (`--remote-debugging-port` + `/json/list` + `Page.captureScreenshot`), sem instalar dependência. Login: injetar `calendario_token` / `calendario_user` no `localStorage` (essas são as chaves reais, ver `services/api.js`).

Ver [[project_ui_sweep]] e [[test_user_convention]].
