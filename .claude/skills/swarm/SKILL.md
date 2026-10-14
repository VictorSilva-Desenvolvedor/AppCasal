---
name: swarm
description: Simula dezenas a centenas de usuários sintéticos com personalidades (Big Five), letramento digital, paciência e objetivos para prever uso, atrito e abandono em um sistema web, app mobile ou software desktop. Use quando pedirem "swarm", "simular usuários", "testar com personas", "prever uso", "A/B sintético", "focus group sintético" ou "testar UX com agentes".
---

# Swarm — simulação de usuários sintéticos em massa

Combina o melhor de UXAgent (fast/slow loop + entrevista), AgentA/B (controle × tratamento),
AgentTorch (arquétipos para escalar), OASIS (mix LLM + regras), TinyTroupe (cache/checkpoint),
focusgroup (persona × intenção × estado) e user-simulator (evidência + Round 2).

**Regra de ouro:** swarm é *filtro*, não validação. Confie em **deltas** (A vs B, antes vs depois)
e em **onde** as personas travam — nunca em taxas absolutas.

## Fluxo (siga em ordem)

### 1. Briefing (pergunte só o que faltar)
- **Alvo**: `web` | `mobile` | `desktop` → leia `reference/target-<alvo>.md`
- **Como acessar**: URL / build+emulador / executável
- **Tarefas** (1–5): objetivo + critério de sucesso observável
- **Público**: segmentos e proporções (ou usar padrão BR geral)
- **Modo**: `explore` (achar atrito) | `ab` (comparar variantes) | `regression` (Round 2 após correção)
- **Tamanho**: N total (padrão 100) e nº de arquétipos executados de verdade (padrão 12)

### 2. População
```bash
python3 scripts/population.py --n 100 --archetypes 12 --seed 42 \
  --segments segments.json --mode ab --out run/population.json
```
- Atributos estruturados amostrados de distribuição (ver `reference/persona-schema.md`).
  **Não** peça ao LLM para inventar biografias longas — aumenta viés e homogeneidade.
- Script força **quota de negatividade** (≥25% impacientes/céticos/low-tech) e
  **agentes de regra** (~20%: abandonam por limiar, sem LLM).
- Opcional: ancorar em `nvidia/nemotron-personas-brazil` (CC BY 4.0) para segmento BR.

### 3. Execução (arquétipos)
Para cada arquétipo em `population.json["archetypes"]`:
1. Monte o prompt a partir de `templates/agent-mission.md` (persona + tarefa + regras do alvo).
2. Rode como subagente (ou sequencialmente) usando a ferramenta do alvo.
3. **Fast loop**: agir passo a passo como a persona agiria (inclusive errar, hesitar, desistir).
   **Slow loop** a cada ~5 passos ou ao travar: "isso faz sentido pra mim? continuo?"
4. Registrar cada passo em `run/traces/<agent_id>.jsonl` (formato em `reference/trace-format.md`).
5. Ao final: **entrevista em personagem** (3 perguntas fixas) → campo `debrief`.

Agentes de regra e instâncias não executadas herdam o resultado do arquétipo com ruído
(o `aggregate.py` faz isso a partir de `population.json`).

### 4. Agregação
```bash
python3 scripts/aggregate.py --population run/population.json \
  --traces run/traces --out run/report.json
```
Produz: sucesso/abandono por segmento, passos médios, pontos de travamento (top telas/ações),
delta A/B com intervalo bootstrap, e citações dos debriefs.

### 5. Relatório
Use `reference/report.md`. Sempre inclua a seção **Limites** (viés positivo, homogeneidade,
agentes mais objetivos que humanos). Em `regression`, compare com o report anterior.

## Anti-vieses obrigatórios (ver `reference/biases.md`)
- Instruir explicitamente a persona a desistir quando o limiar de paciência estourar.
- Proibir linguagem educada artificial no debrief ("seja direto como essa pessoa seria").
- Não deixar um agente ver o resultado de outro (evita efeito manada).
- Variar modelo/temperatura entre arquétipos quando possível.
