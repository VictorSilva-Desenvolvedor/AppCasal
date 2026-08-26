---
name: reference-test-data-cleanup
description: How to delete a throwaway user created during manual testing (no DELETE endpoint) and the DNS quirk that blocks direct Mongo access
metadata:
  type: reference
---

There is no `DELETE /api/users` route, so a user created while testing `/register`
has to be removed straight from MongoDB Atlas with a throwaway mongoose script
that reads `calendario-web/backend/.env` for `MONGO_URI`.

Two gotchas that cost a round each:

- The Atlas SRV lookup (`querySrv _mongodb._tcp...`) fails from the agent shell with
  `ECONNREFUSED` under both the sandbox and `dangerouslyDisableSandbox`. Adding
  `require('dns').setServers(['8.8.8.8', '1.1.1.1'])` before `mongoose.connect`
  makes it work (still needs `dangerouslyDisableSandbox`).
- Requires must point at `calendario-web/backend/node_modules/...` by absolute path
  when the script lives in the scratchpad.

**Já existe um segundo usuário no mesmo time do `Teste`: `Teste2` / `Teste2@123`** (mesmo
`team: "teste"`). Use-o para qualquer fluxo que precise de duas pessoas (convites, hábitos
conjuntos, notificação de parceiro) em vez de registrar alguém novo. Dados criados por ele
saem limpos pela própria API: `DELETE /api/events/:id` já apaga em cascata as
`Invitation` do evento (`eventController.js`), o que é o único jeito de remover convite
já aceito/recusado — `DELETE /api/invitations/:id` só aceita convite **pendente** e só do
próprio remetente.

**How to apply:** prefer testing error paths (duplicate name → 409, empty body →
400) which create nothing; only create a clearly disposable user for the happy path
and delete it in the same session. See [[test-user-convention]] and
[[project-ui-sweep]].
