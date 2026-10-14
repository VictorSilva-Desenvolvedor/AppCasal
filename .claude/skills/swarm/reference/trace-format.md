# Formato do trace (`run/traces/<agent_id>.jsonl`)

Uma linha JSON por passo:
```json
{"step": 3, "action": "click", "target": "btn#checkout", "screen": "/cart", "progress": true, "thought": "achei o botão", "error": null, "ms": 1800}
```
Última linha obrigatória (resumo):
```json
{"final": true, "outcome": "success|abandon|error", "task": "comprar", "steps": 14,
 "stuck_at": "/payment", "debrief": {"facil": 2, "frustracao": "...", "mudaria": "..."}}
```
- `progress`: o passo aproximou do objetivo?
- `stuck_at`: tela onde parou (abandon/error) — vira ranking de atrito
- `debrief.facil`: 1–5 (SEQ)

## Entrevista final (3 perguntas, em personagem, sem polidez artificial)
1. De 1 a 5, quão fácil foi? (só o número)
2. O que mais te irritou ou confundiu?
3. Se pudesse mudar uma coisa, qual seria?
