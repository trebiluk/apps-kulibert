#!/usr/bin/env python3
"""Generates the table pages of blocks/docs/wiki/ from REGISTRY.json. Hand-written pages (README, LORE, STYLE-GUIDE) are not touched.
Run: python3 build_wiki.py REGISTRY.json OUTDIR"""
import sys, json, os
reg = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
E = reg['entries']; RC = reg['recipes']; name = {e['key']: e['name']['en'] for e in E}
HEAD = '<!-- GENERATED from REGISTRY.json by tools/build_wiki.py. Do not edit by hand: change the registry, then rebuild. -->\n'
def nm(k): return ' or '.join(name.get(x, x) for x in k.split('|'))
def recipe_line(r): return f"{' + '.join(f'{n} {nm(k)}' for k, n in r['in'])} → {r['out'][1]} {nm(r['out'][0])} ({r['at']}{', ' + r['gate'] if r['gate'] else ''})"
def table(rows, cols):
    s = '| ' + ' | '.join(cols) + ' |\n|' + '---|' * len(cols) + '\n'
    for r in rows: s += '| ' + ' | '.join(str(x if x not in (None, '') else '–').replace('|', '/') for x in r) + ' |\n'
    return s
PAGES = [('blocks.md', 'Blocks', ['block']), ('ores.md', 'Ores and rocks', ['ore']), ('machines.md', 'Machines and devices', ['machine']), ('items.md', 'Items', ['item']),
         ('critters-and-bots.md', 'Critters and bots', ['mob']), ('biomes.md', 'Biomes', ['biome']), ('elements.md', 'Elements (Periodic Table Wallet)', ['element']), ('effects.md', 'Effects (Wonder Lab)', ['effect'])]
for fn, title, types in PAGES:
    rows = []
    for e in E:
        if e['type'] not in types: continue
        rs = [r for r in RC if r['out'][0] == e['key']]
        rows.append([e['id'] if e['id'] else '', f"**{e['name']['en']}** `{e['key']}`", e.get('desc'), ', '.join(e['verbs']), '<br>'.join(recipe_line(r) for r in rs), e['stage'], e.get('fact'), e['dexId'], e.get('assetId')])
    open(f'{out}/{fn}', 'w').write(HEAD + f'# {title}\n\n{len(rows)} entries. Text is a **draft** until Curriculum Bot checks it. Verbs are the locked ten (see verbs.md).\n\n' +
                                   table(rows, ['id', 'Name', 'What it is', 'Verbs', 'Recipe', 'Stage', 'Fact chip', 'Bertodex', 'Asset']))
by_at = {}
for r in RC: by_at.setdefault(r['at'], []).append(r)
s = HEAD + '# Recipes\n\nThe rule of thumb (GM-ANSWERS §5): wood, cloth, glass and food at the Workbench and Oven. Ores to metal at the Smelter. Metal shaping on the Forge tab. Anything with a battery, silicon or a chip at the Fabricator.\n\n'
for at in ('hand', 'workbench', 'oven', 'smelter', 'forge', 'fabricator'):
    s += f'## {at.title()}\n\n' + table([[recipe_line(r), r['secs'], r['gate'], r['source']] for r in by_at.get(at, [])], ['Recipe', 'Seconds', 'Gate', 'Source']) + '\n'
open(f'{out}/recipes.md', 'w').write(s)
v = HEAD + '# The ten verbs\n\nEverything in Bertopia uses these ten. Nothing gets its own special control (CORE-MECHANICS §0).\n\n'
for verb in reg['verbs']:
    users = [e['name']['en'] for e in E if any(x.split(' ')[0] == verb for x in e['verbs'])]
    v += f'## {verb}\n{len(users)} things: ' + ', '.join(users[:60]) + (' …' if len(users) > 60 else '') + '\n\n'
open(f'{out}/verbs.md', 'w').write(v)
print('wiki pages:', len(PAGES) + 2)
