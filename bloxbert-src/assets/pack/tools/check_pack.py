#!/usr/bin/env python3
"""Builds MANIFEST.csv from generator rows + planned list, then checks the pack. Exit 1 on any failure.
Checks: every file in the pack is in the manifest; every manifest file exists; every row has a license; no 'guessed' licence
(sourced rows must cite a URL + Kenney License.txt present); registry ids 1..31 match live; atlas json names exist;
no pure #FFFFFF pixel in block textures (WORLD-2 §4); textures are 32x32; no brand/forbidden words in names."""
import os, sys, csv, json, glob, hashlib
from PIL import Image
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); sys.path.insert(0, HERE)
import planned, registry_src as R
HDR = ['id', 'type', 'file', 'size', 'source_url', 'license_as_stated', 'author', 'made_by', 'used_by', 'sha256_12']
LIVE = ['grass', 'dirt', 'stone', 'slate', 'coal', 'sand', 'gravel', 'brickRed', 'brickGrey', 'planks', 'log', 'leaves', 'woolBlue', 'woolGreen', 'woolRed', 'woolTan',
        'snow', 'ice', 'redSand', 'glass', 'coreplate', 'workbench', 'oven', 'vend', 'storeCounter', 'bunk', 'box', 'wheat', 'reed', 'door', 'doorOpen']
FORBID = ['minecraft', 'mojang', 'creeper', 'enderman', 'redstone', 'netherite', 'nether', 'notch', 'steve', 'herobrine', 'pokemon', 'disney', 'lego', 'roblox', 'fortnite', 'nike']
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()[:12]
def main():
    rows = []
    for f in ('_manifest_tex.csv', '_manifest_sfx.csv', '_manifest_icons.csv'):
        for r in csv.reader(open(f'{HERE}/{f}')): rows.append(r + [sha(f'{ROOT}/{r[2]}')])
    gen = [('atlas/terrain.png', 'atlas'), ('atlas/alpha.png', 'atlas'), ('atlas/items.png', 'atlas'), ('atlas/terrain.json', 'atlas-map'), ('atlas/alpha.json', 'atlas-map'),
           ('atlas/items.json', 'atlas-map'), ('registry.json', 'registry'), ('REGISTRY.json', 'registry-wiki'), ('dex/bertodex-en.json', 'dex-text')]
    for p, t in gen:
        rows.append([os.path.basename(p), t, p, '', '', 'Contains Kenney CC0 tiles + project-original content (see per-tile rows)', 'Kenney + trebiluk project', 'built', 'game', sha(f'{ROOT}/{p}')])
    for pid, t, stage, note in planned.PLANNED:
        rows.append([pid, t, '', '', '', 'n/a (planned, not drawn)', '', 'planned', f'{stage}: {note}', ''])
    with open(f'{ROOT}/MANIFEST.csv', 'w', newline='') as fh: w = csv.writer(fh); w.writerow(HDR); w.writerows(rows)
    errs = []
    files = {r[2] for r in rows if r[2]}
    for p in glob.glob(f'{ROOT}/**/*', recursive=True):
        rel = os.path.relpath(p, ROOT)
        if os.path.isdir(p) or rel.startswith(('tools/', 'licenses/', 'src-cache/')) or rel in ('MANIFEST.csv', 'README.md'): continue
        if rel not in files: errs.append(f'unlisted file {rel}')
    for r in rows:
        if r[2] and not os.path.exists(f'{ROOT}/{r[2]}'): errs.append(f'missing {r[2]}')
        if not r[5]: errs.append(f'no license {r[0]}')
        if r[7].startswith('sourced') and not (r[4].startswith('https://kenney.nl/assets/') and 'CC0' in r[5]): errs.append(f'sourced row without stated license/url {r[0]}')
        if any(b in (r[0] + ' ' + r[8]).lower() for b in FORBID): errs.append(f'forbidden word {r[0]}')
    for lic in ('KENNEY-voxel-pack-License.txt', 'KENNEY-impact-sounds-License.txt', 'KENNEY-interface-sounds-License.txt', 'KENNEY-music-jingles-License.txt', 'KENNEY-rpg-audio-License.txt'):
        t = open(f'{ROOT}/licenses/{lic}').read()
        if 'CC0' not in t and 'Creative Commons Zero' not in t: errs.append(f'license text lacks CC0: {lic}')
    reg = json.load(open(f'{ROOT}/registry.json'))
    for b in reg['blocks'][:31]:
        if LIVE[b['id'] - 1] != b['key']: errs.append(f'live id mismatch {b}')
    for b in reg['blocks'] + reg['items']:
        if any(x in b['name']['en'].lower() for x in FORBID): errs.append(f'forbidden name {b["key"]}')
    tj = json.load(open(f'{ROOT}/atlas/terrain.json'))
    if tj['names'][:21] != ['grass_top', 'dirt_grass', 'dirt', 'stone', 'greystone', 'stone_coal', 'sand', 'gravel_stone', 'brick_red', 'brick_grey', 'wood', 'trunk_top', 'trunk_side', 'leaves', 'cotton_blue', 'cotton_green', 'cotton_red', 'cotton_tan', 'snow', 'ice', 'redsand']:
        errs.append('terrain atlas first 21 differ from live atlas.json')
    if len(tj['names']) > 256: errs.append('terrain atlas > 256 layers')
    for p in glob.glob(f'{ROOT}/textures/blocks/*.png'):
        a = np.asarray(Image.open(p).convert('RGBA'))
        if a.shape[:2] != (32, 32): errs.append(f'size {p}')
        if ((a[..., :3] == 255).all(-1) & (a[..., 3] > 0)).any(): errs.append(f'pure white pixel {os.path.basename(p)}')
    for p in glob.glob(f'{ROOT}/icons/ui/*.svg'):
        s = open(p).read()
        if 'viewBox="0 0 24 24"' not in s or 'currentColor' not in s or 'aria-hidden="true"' not in s or 'stroke-width="2"' not in s: errs.append(f'RULE-icons {p}')
    keys = {b['key'] for b in reg['blocks']} | {i['key'] for i in reg['items']}
    dex = json.load(open(f'{ROOT}/dex/bertodex-en.json'))['entries']
    for k in keys:
        if not dex.get(k, {}).get('what'): errs.append(f'no dex text {k}')
    by = {}
    for r in rows: by.setdefault((r[1].split(' ')[0], r[7].split(' ')[0]), 0); by[(r[1].split(' ')[0], r[7].split(' ')[0])] += 1
    print('rows', len(rows)); [print(f'  {k[0]:<20} {k[1]:<16} {v}') for k, v in sorted(by.items())]
    lic = {}
    for r in rows: lic[r[5][:40]] = lic.get(r[5][:40], 0) + 1
    print('licenses:'); [print(f'  {v:4} {k}') for k, v in sorted(lic.items(), key=lambda x: -x[1])]
    if errs: print('FAIL'); [print(' ', e) for e in errs[:50]]; sys.exit(1)
    print('PASS check_pack')
if __name__ == '__main__': main()
