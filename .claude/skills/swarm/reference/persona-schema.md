# Schema de persona

| Campo | Tipo | Faixa | Efeito no comportamento |
|---|---|---|---|
| `id` | str | `p0001` | — |
| `segment` | str | do `segments.json` | agrupamento no relatório |
| `age` | int | 16–80 | velocidade de leitura, tamanho de toque |
| `tech_literacy` | float | 0–1 | entende ícones/jargão? usa atalhos? |
| `patience` | float | 0–1 | limiar de desistência = `round(3 + patience*12)` passos sem progresso |
| `goal_focus` | float | 0–1 | baixo = explora/distrai; alto = vai direto |
| `ocean` | dict | O,C,E,A,N ∈ 0–1 | ver abaixo |
| `device` | str | por alvo | viewport, input, rede |
| `accessibility` | list | `low_vision`, `motor`, `none`... | zoom, toque impreciso, leitor de tela |
| `attitude` | str | `enthusiast` `neutral` `skeptic` `hostile` | tom do debrief, tolerância a erro |
| `policy` | str | `llm` \| `rule` | rule = sem LLM, só limiares |
| `variant` | str | `A` \| `B` \| `-` | grupo do A/B |
| `archetype` | str | `arch_03` | arquétipo que representa |

## OCEAN → comportamento
- **O** alto: testa features novas; baixo: só caminho conhecido
- **C** alto: lê instruções, preenche tudo certo; baixo: pula campos, erra formato
- **E** alto: compartilha/convida; baixo: ignora social
- **A** baixo: debrief duro, reclama de fricção
- **N** alto: abandona após erro, desconfia de pagamentos/permissões

## segments.json
```json
[
  {"name": "jovem_mobile", "weight": 0.5, "age": [18, 30], "tech_literacy": [0.6, 1.0]},
  {"name": "senior", "weight": 0.2, "age": [60, 80], "tech_literacy": [0.0, 0.4]},
  {"name": "profissional", "weight": 0.3, "age": [28, 55], "tech_literacy": [0.4, 0.9]}
]
```
Campos não informados usam a distribuição padrão do script.
