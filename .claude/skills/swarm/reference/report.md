# Template do relatório

```markdown
# Swarm — <sistema> · <alvo> · <data>
Modo: <explore|ab|regression> · N=<n> (arquétipos executados: <k>) · seed=<s>

## Resumo (3 linhas)
## Funil por segmento   (tabela: segmento | n | sucesso | abandono | passos médios)
## Top 5 pontos de atrito   (tela/ação | % que travou | personas mais afetadas | citação)
## A/B (se modo ab)   delta de sucesso B−A com IC95% bootstrap; decisão sugerida
## Bugs encontrados   (erros console/HTTP/crash com passo para reproduzir)
## Recomendações (priorizadas por impacto × nº de personas)
## Limites
Resultados são hipóteses de LLM. Confie em deltas e pontos de atrito, não em taxas absolutas.
```
