# Swarm de usuários sintéticos: estado e como continuar

Última sessão: 2026-10-14. Três rodadas com 12 personas (de uma população de 100, seed 42) explorando o calendario-web.
Relatórios completos: [rodada 1](2026-10-14-round1.md) · [rodada 2](2026-10-14-round2.md) · [rodada 3](2026-10-14-round3.md).

## Onde paramos

| Rodada | Código | Sucesso | Facilidade (1–5) |
|---|---|---|---|
| 1 | antes das correções | 5/12 | 2,2 |
| 2 | correções da R1 | 12/12 | 3,3 |
| 3 | `c9b93e7` | 8/12 | 3,3 |

Os 4 resultados ruins da R3 vieram de quedas do backend local, não de bugs. Os defeitos que a R3 achou estão corrigidos em `3d671b9`, **mas ainda não passaram por uma rodada nova**. A meta "100% sem erros" depende da rodada 4.

Commits desta sessão (todos na `main`):
- `c9b93e7` correções das rodadas 1 e 2 (segurança, tela branca, financeiro, acessibilidade)
- `b2eedb3` skill swarm no projeto + `run/` no `.gitignore`
- `3d671b9` correções da rodada 3 (modal isolado, mensagens de erro, hábitos)

## O que foi corrigido

**Segurança e dados**
- O cadastro cria um time próprio (`solo-<id>`) em vez do time `principal` do casal, e já cria as categorias financeiras padrão.
- O middleware de auth confere se o usuário existe e lê o time do banco (token de conta apagada → 401).
- A dica de usuário e senha saiu da tela de login.

**Calendário**
- "Novo evento" da barra lateral deixava a tela em branco (`toDateKey` não importado).
- Error boundary por rota.
- Botão flutuante "Novo evento" no celular. A gaveta fechada fica `inert`/`aria-hidden`.
- Salvar fecha o modal. O lembrete "5, 3, 1" ganhou explicação.
- Filtros sem corte no tablet.

**Financeiro**
- Estado de erro com "Tentar de novo" em vez de "Carregando…" eterno.
- Valores aceitam vírgula (`parseMoneyInput`, com testes).
- A validação aponta e foca o campo, e a marca some quando o campo é corrigido.
- "de Fulano" em lançamento pendente ("pago por" só quando pago).
- Gerenciador de categorias acessível e com erro em pt-BR.
- Mês sem "De" maiúsculo, setas com rótulo, "Sem receita" no lugar de 0%.

**Hábitos**
- Botão "Novo hábito" com texto, toggles com `aria-pressed`, tipos quebram linha no celular.
- O card explica a sequência que espera pelo parceiro. O check-in 409 atualiza e fecha o modal.
- Hábito individual recém-criado leva para a aba onde ele aparece.
- Botões de cor com nome ("Cor Azul").

**Geral**
- O Modal abre em portal e deixa o `#root` `inert` enquanto aberto.
- Erros 5xx viram uma mensagem amigável.
- O tema Rosa passou a ser distinto do Vermelho.

## Pendências

### Decisões suas (banco de produção)
1. **4 contas de persona no Atlas, time `principal`**: Bruno0018, Marta0003, Marta0093 e Quésia0046, com as `settings` padrão delas. Foram criadas por engano na rodada 1. Nenhum evento, lançamento ou hábito foi gravado por elas. Apagar? (`_id`s: `6acfd4d47f78b0a20f20517b`, `6acfd4d77f78b0a20f20517f`, `6acfd4d47f78b0a20f20517d`, `6acfd4d27f78b0a20f205179`)
2. **Cadastros antigos no time do casal**: a correção vale só para contas novas. Quem se cadastrou antes continua em `principal`. Vale listar e revisar os usuários desse time.

### Produto (pedidos recorrentes, não são bugs)
- Campo de **horário** no evento (9 de 12 personas pediram).
- Formulários enxutos com "mais opções": despesa (Natureza/Tipo) e hábito (5 abas, 5 tipos).
- Calendário no celular abrindo na grade do mês atual (hoje é uma lista de 19 meses).
- Menu lateral no Financeiro (foi removido de propósito no commit `461f085`).
- Chips do mês truncados no tablet. Texto secundário com pouco contraste.
- Outros campos de valor (objetivos, importação, carteira) ainda são `type=number` e não aceitam vírgula.

### Ambiente
- O backend local caiu várias vezes sem stack (código 1). Não reproduziu com 18 sessões paralelas nem no cron de lembretes. O `supervise-backend.ps1` reinicia sozinho e guarda o stderr de cada execução em `run/backend-logs/`.
- Bugs da skill (na cópia original em SkillTree também):
  - `population.py` quebra no console Windows. Use `python -X utf8`.
  - A ação `wait` estava documentada, mas não existia. Já existe no `pwserver.mjs`.

## Como continuar em outro computador

### ⚠️ Antes de tudo
`calendario-web/backend/.env` aponta para o **MongoDB Atlas de produção**. Qualquer `npm run dev`, `node src/server.js` ou `node src/seed.js` sem `MONGO_URI` definido grava nos dados reais. O `seed.js` roda só de ser importado, então nunca faça `require` dele para conferir sintaxe (use `node --check`). Depois de parar um servidor, confira se a porta liberou: o nodemon deixa filhos vivos.

### 1. Preparar (uma vez)
```bash
git pull
cd calendario-web/backend && npm install && cd ../frontend && npm install && cd ../..
# Playwright para o servidor de navegador, fora do repo:
mkdir -p ~/swarm-pw && cd ~/swarm-pw && npm init -y && npm i playwright && npx playwright install chromium
cp <repo>/.claude/skills/swarm/tools/pwserver.mjs ~/swarm-pw/
```
Também precisa do Python 3 (só biblioteca padrão) e do Claude Code aberto na raiz do repo (a skill `swarm` já vem no `.claude/skills/`).

### 2. Subir o ambiente (4 terminais, na raiz do repo)
```bash
node .claude/skills/swarm/tools/mem-mongo.cjs                     # 1. Mongo em memória :27999 (espere READY)
powershell -ExecutionPolicy Bypass -File .claude/skills/swarm/tools/supervise-backend.ps1   # 2. backend :3000
cd calendario-web/frontend && npx vite --port 5500 --force        # 3. frontend :5500
node ~/swarm-pw/pwserver.mjs                                      # 4. navegador :4777
```
Popular o banco de teste (cria Victor/Maria e as contas Teste/Teste2):
```bash
cd calendario-web/backend && MONGO_URI=mongodb://127.0.0.1:27999/swarm node src/seed.js
```
Em macOS/Linux, troque o passo 2 por `MONGO_URI=mongodb://127.0.0.1:27999/swarm node src/server.js` (dentro de `calendario-web/backend`).

### 3. Rodar a rodada 4
```bash
mkdir -p run && cp docs/swarm/population.json docs/swarm/segments.json run/
python -X utf8 .claude/skills/swarm/tools/make-missions.py --own-accounts
```
`--own-accounts` dá uma conta nova a cada persona e elimina o ruído das contas Teste/Teste2 compartilhadas (eventos "duplicados", contador de notificações subindo sozinho).

No Claude Code, peça algo como:

> Rode a rodada 4 do swarm (regression) seguindo docs/swarm/README.md: o ambiente já está de pé; dispare 12 subagentes em background, cada um lendo `run/prompt_arch_XX.md` (alternando sonnet e haiku). Quando terminarem, rode `python -X utf8 .claude/skills/swarm/scripts/aggregate.py --population run/population.json --traces run/traces --out run/report.json`, compare com docs/swarm/2026-10-14-round3.md e separe defeito real de artefato do ambiente.

### 4. Depois de cada rodada
- Copie o relatório para `docs/swarm/<data>-roundN.md` (`run/` fica fora do git).
- Corrija, rode os testes (`npx jest` no backend, `npx vitest run` e `npx vite build` no frontend), faça commit e push.
- Repita até uma rodada sem defeito de código.
