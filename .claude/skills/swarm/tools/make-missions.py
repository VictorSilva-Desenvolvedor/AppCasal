"""Gera run/prompt_arch_XX.md (uma missão por arquétipo) a partir de run/population.json.

Uso, na raiz do repo:
    python -X utf8 .claude/skills/swarm/tools/make-missions.py

Os 4 primeiros arquétipos se cadastram com conta nova; os demais usam Teste/Teste2
(o seed cria essas contas). Passe --own-accounts para dar conta própria a todos,
o que evita o ruído de várias personas na mesma conta.
"""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
RUN = ROOT / 'run'
SKILL = ROOT / '.claude' / 'skills' / 'swarm'

TOOL = '''Navegador já rodando: servidor HTTP em localhost:4777. Cada chamada é um passo, via Bash (se o sandbox bloquear localhost, use dangerouslyDisableSandbox: true).
SEMPRE escreva o corpo JSON num arquivo UTF-8 (ferramenta Write, em {run}/tmp/AGENT.json) e envie com:
  curl -s -X POST localhost:4777 --data-binary @{run}/tmp/AGENT.json
  (NUNCA use -d inline: corrompe acentos e gera timeouts falsos.)
Primeiro passo: {{"agent":"AGENT","op":"open","device":"DEVICE"}} (abre /login).
ops: goto{{url:"/app"}}, click{{text:"Entrar"}} | click{{role:"button",name:"Salvar"}} | click{{selector:"css"}}, fill{{label:"Nome",value:"x"}} (label exato) | fill{{placeholder}} | fill{{selector}}, select{{label,value}}, press{{key:"Enter"}}, scroll{{dy:600}}, back, wait{{ms:1500}}, snapshot, screenshot{{path:"{run}/shots/AGENT-N.png"}}, abandon, done
Cada resposta traz url, árvore de acessibilidade e "errors" (console/pageerror/HTTP>=400 desde o passo anterior). ANOTE todo erro.
Acessibilidade: low_vision -> reclame de texto pequeno/contraste ao ver screenshots; motor -> às vezes clique no elemento vizinho errado.'''

TASK = ('Exploração livre do AppCasal (calendário/finanças/hábitos de casal). Entre no app ({cred}) e use-o do jeito '
        'que você usaria na vida real: olhe as telas que te interessarem, tente fazer 2-3 coisas que fariam sentido '
        'para você (ex.: marcar um compromisso, lançar uma conta, criar um hábito, mexer em configurações). '
        'Repare em tudo que quebra, confunde, não responde ou parece errado.')

FOOTER = '''

## Regras do ambiente (obrigatórias)
- NÃO mexa em processos, servidores, portas, banco de dados (nada de seed, kill, npm, node) nem edite código do projeto. Só o navegador via localhost:4777.
- Se o app inteiro parar de responder (vários HTTP 500 seguidos), pare e relate; não tente consertar.
- Limite técnico: no máximo 35 passos. Não olhe outros arquivos em run/traces (outros agentes).
- Termine com op abandon ou done (fecha o navegador).

## Formato do trace (escreva o arquivo com Write ao final)
Uma linha JSON por passo: {"step":3,"action":"click","target":"botão Salvar","screen":"/app/financeiro","progress":true,"thought":"...","error":null,"ms":1800}
Última linha: {"final":true,"outcome":"success|abandon|error","task":"exploracao","steps":N,"stuck_at":"/rota ou null","debrief":{"facil":1-5,"frustracao":"...","mudaria":"..."}}

## Resposta final para mim (fora do personagem, objetiva)
1. outcome e passos; 2. lista de DEFEITOS (rota, passos para reproduzir, obtido vs esperado, erros literais); 3. pontos de confusão de UX; 4. as 3 respostas da entrevista.'''


def label(value, low, mid, high):
    return low if value < 0.34 else mid if value < 0.67 else high


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--own-accounts', action='store_true')
    args = parser.parse_args()

    pop = json.loads((RUN / 'population.json').read_text(encoding='utf-8'))
    personas = {p['id']: p for p in pop['personas']}
    template = (SKILL / 'templates' / 'agent-mission.md').read_text(encoding='utf-8')
    run = RUN.as_posix()
    (RUN / 'tmp').mkdir(exist_ok=True)
    (RUN / 'traces').mkdir(exist_ok=True)
    (RUN / 'shots').mkdir(exist_ok=True)

    for i, arch in enumerate(pop['archetypes']):
        p = personas[arch['representative']]
        o = p['ocean']
        if args.own_accounts or i < 4:
            cred = f"Você ainda NÃO tem conta: cadastre-se com nome '{p['name']}{p['id'][1:]}' e uma senha que você inventar."
        else:
            name, pwd = ('Teste', 'Teste@123') if i % 2 == 0 else ('Teste2', 'Teste2@123')
            cred = f"Você já tem conta: nome '{name}' senha '{pwd}'."
        tech = label(p['tech_literacy'], 'baixa', 'média', 'alta')
        pat = label(p['patience'], 'baixa', 'média', 'alta')
        text = template.format(
            name=p['name'], age=p['age'], segment=p['segment'], device=p['device'],
            tech_literacy_label=tech, patience_label=pat, give_up_after=p['give_up_after'],
            goal_focus_label=label(p['goal_focus'], 'disperso', 'moderado', 'focado'), attitude=p['attitude'],
            ocean_text=f"abertura {o['O']}, conscienciosidade {o['C']}, extroversão {o['E']}, amabilidade {o['A']}, neuroticismo {o['N']} (0-1)",
            accessibility=', '.join(p['accessibility']), task=TASK.format(cred=cred),
            success_criteria='você concluiu pelo menos uma coisa que queria fazer e saiu satisfeito', variant=arch['variant'],
            allowed_actions='goto, click, type, scroll, back, wait, search, abandon, done',
            persona_summary=f"{p['name']}, {p['age']} anos, tecnologia {tech}, paciência {pat}, {p['attitude']}",
            trace_path=f"{run}/traces/{p['id']}.jsonl",
            target_instructions=TOOL.format(run=run).replace('AGENT', p['id']).replace('DEVICE', p['device']),
        ).replace('reference/trace-format.md', (SKILL / 'reference' / 'trace-format.md').as_posix())
        (RUN / f"prompt_{arch['id']}.md").write_text(text + FOOTER, encoding='utf-8')
    print(f"{len(pop['archetypes'])} missões em {run}")


if __name__ == '__main__':
    main()
