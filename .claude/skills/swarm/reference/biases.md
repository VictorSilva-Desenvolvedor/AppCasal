# Vieses conhecidos e contramedidas

| Viés (literatura) | Contramedida na skill |
|---|---|
| Positividade / hiperatividade (OmniBehavior) | quota ≥25% de personas negativas; limiar de paciência explícito; abandono é resultado válido |
| Homogeneização entre personas | atributos estruturados amostrados, não bio livre do LLM; variar modelo/temperatura |
| Mais detalhe = mais viés | persona curta (tabela), sem backstory longa |
| Agentes mais objetivos que humanos (AgentA/B) | `goal_focus` baixo força exploração/distração; tratar nº de passos como limite inferior |
| Efeito manada (OASIS) | agentes isolados, nunca veem outros resultados |
| Deriva de persona em sessões longas | reinjetar resumo da persona a cada slow loop |
| Skew WEIRD/demográfico | ancorar em Nemotron-Personas-Brazil ou dados reais do produto |
| WTP / aprovação inflada | nunca reportar % absoluto de "compraria"; só delta |

Se houver analytics reais: calibrar comparando funil real × sintético e reportar o fator de correção.
