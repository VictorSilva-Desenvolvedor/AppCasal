# CLAUDE.md

Este arquivo orienta o Claude Code (ou qualquer assistente) ao trabalhar neste repositório.
Lembre-se de sempre retirar o cloud como co-autor

## Visão Geral do Projeto
- Nome: CalendarioPessoal (calendario-web)
- Objetivo: Aplicação web de calendário pessoal — autenticação de usuários, criação/gestão de eventos, upload de anexos, configurações de usuário, log de atividades e solicitações de atualização.
- Stack:
  - Backend: Node.js + Express 5, MongoDB via Mongoose, autenticação com JWT + bcrypt, upload de arquivos com Multer + Cloudinary.
  - Frontend: HTML/CSS/JS/react-Vite/Tailwind, servido estaticamente (live-server em dev).
- Como rodar localmente:
  - Backend: `cd calendario-web/backend && npm install && npm run dev` (nodemon, lê `.env` — copiar de `.env.example` e preencher `MONGO_URI`, `JWT_SECRET`, credenciais Cloudinary). Sobe em `http://localhost:3000`.
  - Frontend: `cd calendario-web/frontend && npm install && npm run dev` (live-server na porta 5500, entry-file `pages/login.html`). Em produção o backend também serve o frontend como estático (`app.use(express.static(frontendDir))`).
  - Seed de dados: `npm run seed` (dentro de `calendario-web/backend`).
- Como rodar os testes:
  - **Não há suíte de testes configurada no momento.** Antes de declarar uma tarefa concluída, ao menos validar manualmente o fluxo afetado (ex.: via `/api/health` e endpoints relevantes) e rodar `node -c` ou iniciar o servidor para garantir que não há erros de sintaxe/carregamento. Se o usuário pedir testes automatizados, perguntar qual framework prefere (Jest/Vitest) antes de introduzir uma nova dependência.

## Princípios de Código
- **KISS**: prefira a solução mais simples que resolve o problema. Evite abstrações prematuras.
- **Legibilidade > esperteza**: nomes claros, funções curtas, responsabilidade única.
- **Modularidade**: separe lógica de negócio, acesso a dados e interface. Evite arquivos gigantes.
- **Sem código placeholder**: toda entrega deve ser um bloco completo e funcional, pronto para rodar. Não usar `// TODO: implementar depois` como resposta final.
- **Consistência**: siga o estilo já existente no repositório (indentação, nomenclatura, estrutura de pastas) antes de introduzir um novo padrão.

## Testes
- Toda nova lógica de negócio deve vir acompanhada de testes unitários **quando houver suíte de testes disponível no projeto**. Como ainda não existe, ao introduzir a primeira suíte, alinhar com o usuário o framework e a estrutura de pastas antes de escrever os testes.
- Testes devem cobrir o caminho feliz e pelo menos um caso de erro/borda.
- Rodar a suíte de testes antes de considerar uma tarefa concluída (quando existir).
- Não remover ou desativar testes existentes para "fazer passar" — corrigir a causa raiz.

## Fluxo ao Corrigir Bugs
1. Reproduzir o problema (ou entender exatamente o que está falhando).
2. Diagnosticar a causa raiz antes de propor mudanças.
3. Propor a correção mínima necessária — **não reescrever o código inteiro** a menos que seja explicitamente pedido.
4. Explicar brevemente o que mudou e por quê.

## Fluxo ao Adicionar Funcionalidade
1. Confirmar entendimento do requisito (se ambíguo, assumir a interpretação mais razoável e declarar a suposição).
2. Planejar a menor mudança que atende ao requisito de forma limpa.
3. Implementar com testes (quando houver suíte de testes).
4. Rodar lint/build/testes antes de finalizar (quando existirem esses scripts).

## O que Evitar
- Dependências novas sem necessidade clara.
- Duplicação de lógica já existente no projeto.
- Comentários óbvios ou redundantes; comentar apenas o "porquê", não o "o quê".
- Mudanças fora do escopo pedido.
- Nunca commitar `.env` com segredos reais (apenas `.env.example` deve ir para o controle de versão).

## Convenções Específicas do Projeto
- Estrutura do backend segue padrão MVC simplificado: `routes/` → `controllers/` → `models/`, com `middleware/` para auth e upload, e `services/` para lógica auxiliar reutilizável (ex.: `activityLogger.js`).
- Rotas da API são prefixadas por recurso em `/api/*` (ex.: `/api/auth`, `/api/events`, `/api/upload`, `/api/settings`, `/api/users`, `/api/activity-logs`, `/api/update-requests`).
- Autenticação via JWT (ver `middleware/auth.js`); senhas com bcrypt.
- Uploads de arquivos/fotos de eventos são armazenados no Cloudinary (ver `config/storage.js`, `middleware/upload.js`).
- Erros da API seguem o handler central em `server.js`: `ValidationError` → 400, erro de duplicidade (Mongo code 11000) → 409, demais → `err.status` ou 500, sempre no formato `{ message }`.
- Frontend é HTML/CSS/JS vanilla organizado por página em `pages/`, com lógica correspondente em `js/pages/` e chamadas à API centralizadas em `js/api.js`.
- Mensagens de erro e textos de interface estão em português (pt-BR) — manter esse idioma em novas mensagens voltadas ao usuário.
