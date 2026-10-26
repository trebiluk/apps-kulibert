## Part 3 of 6

````text
Ramp & Fill RF 1.0.22 — Pour Lines
Part 3 of 6: levels 8-21 with gel, syrup, water, overflowing jars. Parts 1-2 are on main: pull --rebase first, no force-push.

VERSION STAMP: Debugzy locks RF 1.0.22; never pick or lower it. Sites as in Part 1 (index.html title, #ver-plate, .ver-plate, #whats-body, data-version, 3 ?v=RF-… busters; app.js line-1 comment, VERSION, 9 `whats:` lines). whats = "RF RF 1.0.22 — " + en "Pour Lines: 14 new levels with gel, syrup and water." / uk "Pour Lines: 14 нових рівнів із гелем, сиропом і водою." / ru "Pour Lines: 14 новых уровней с гелем, сиропом и водой." / es "Pour Lines: 14 niveles nuevos con gel, almíbar y agua." / ar "Pour Lines: ١٤ مستوى جديدًا بالجل والشراب والماء." / fa-AF "Pour Lines: ۱۴ مرحلهٔ تازه با ژل، شیره و آب." / rw "Pour Lines: urwego 14 rushya rufite gel, sirop n'amazi." / ti "Pour Lines፦ 14 ሓደሽቲ ደረጃታት ምስ ጀል፣ ሽሮፕን ማይን።" / simple = en.

OUT OF SCOPE: stars, saves, Solve; any change to levels 1-7 or the sugar feel.

FIX 1 — materials in pourlines.js. Grain gets k. Sugar is exactly as in Part 1.
k name  r   gravity e   mu   drag fluid visc
0 sugar 2.6 1       .2  .004 0    -     -
1 gel   3.6 .7      0   .012 .5   -     -
2 syrup 2.4 1       .02 0    .3   yes   .08
3 water 2.2 1       .06 0    .02  yes   .01
Bounce uses e and tangent ×(1−mu) per material; drag = v·(1−drag·dt). Names: t("grains"), t("gel"), PL.syrup, t("water").
- Fluid separation (k 2,3), once per step after the move, 6 px spatial hash. Each pair with d < r1+r2: push = (r1+r2−d)·0.25 along the normal plus a sideways nudge 1.1·push·|ny| apart; if approaching, take half the closing speed off each; blend velocities by the average visc. Sum pushes per grain, apply once, cap 1.2 px per step (stops stacked water squeezing through a thin line).
- Level format adds a 4th item to a spout [x,y,rate,k], a 6th and 7th to a jar [x,y,w,h,g,k,spill], and level slack (default 1.3; use it in the supply formula).
- Mixing: a wrong-k grain in a jar is deleted and counts bad. tol = max(2, ceil(tg·0.08)). bad > tol = lose "mixed" at once; a win needs bad ≤ tol.
- Overflow: a full jar (n ≥ tg) with spill re-emits an arriving grain of its own k at (x−8 | x+w+8, y−6), vx ∓/±90, vy −80, instead of counting it. spill l = left rim, r = right, b = both (alternate).

FIX 2 — levels 8-21 (append to LV, Part 1 format; chips grow to 21, wrapping, 44x48):
8 ink11 S[400,70,70] J[60,490,110,70,25],[630,490,110,70,25] L[340,160,400,130,460,160] M[200,310,60,1.8,0],[600,310,60,-1.8,1]
9 ink10 S[150,70,30,1] J[560,470,100,90,30,1]
10 ink10 slack1.5 S[520,60,70,3] J[350,490,200,70,30,3] L[450,220,590,220]
11 ink8 slack1.4 S[150,60,60] J[100,300,100,70,20,0,'r'],[300,430,110,80,30]
12 ink12 slack1.4 S[410,60,70] J[360,250,100,60,15,0,'b'],[150,420,110,70,15],[560,420,110,70,15]
13 ink10 S[180,60,40],[330,60,40,3] J[300,490,110,70,25],[580,490,110,70,25,3]
14 ink12 S[140,60,70,2] J[580,490,130,70,40,2] M[340,300,75,1.5,0.4]
15 ink14 S[120,60,30],[400,60,25,1],[640,60,35,2] J[330,490,90,70,20],[480,490,90,70,20,1],[680,490,90,70,20,2]
16 ink14 slack1.5 S[110,60,70] J[60,200,100,60,12,0,'r'],[240,320,100,60,12,0,'r'],[420,440,100,60,12,0,'r'],[600,490,120,70,30]
17 ink12 slack1.4 S[200,60,35],[600,60,35] J[150,200,100,60,15,0,'r'],[550,200,100,60,15,0,'l'],[350,430,100,80,40]
18 ink12 S x=100,250,400,550,700 at y52 rate14 k3 J[300,490,200,70,40,3] L[260,280,400,240,540,280]
19 ink8 S[120,60,70,3] J[680,490,110,70,35,3] L[60,180,330,215],[560,290,260,330],[100,400,400,430]
20 ink12 S[150,60,70,3] J[600,490,130,70,40,3] M[300,230,55,2,0.3],[520,370,55,-2,1.2]
21 ink14 S[100,60,25],[300,60,20,1],[500,60,25,2],[730,60,30,3] J[230,490,90,70,15],[400,490,90,70,15,1],[570,490,90,70,15,2],[690,490,100,70,20,3]

FIX 3 — no colour-only meaning, plus words.
- Grain shapes, one path per material per frame: sugar circle, gel rounded square (side 2r), syrup diamond, water ring. Muted fills (cream, olive, amber, steel blue), no neon.
- Jar badge "A · Gel · 12 / 20 g" (g for sugar and gel, ml for syrup and water); "✓" when full, "✗" when mixed up.
- Lose title by cause: PL.mixed, PL.stuck (grains left, calm), PL.noSupply (none left). No sound; overflow and mixing show by text and shape only.
PL additions (syrup | mixed | stuck | noSupply):
en Syrup|Mixed up|Stuck on the board|Out of supply
uk Сироп|Усе змішалось|Застрягло на полі|Запас вичерпано
ru Сироп|Всё смешалось|Застряло на поле|Запас кончился
es Almíbar|Se mezcló todo|Atascado en el tablero|Sin material
ar شراب|اختلط كل شيء|علق على اللوحة|نفدت المادة
fa-AF شیره|همه قاطی شد|روی صفحه گیر کرد|مواد تمام شد
rw Sirop|Byarivanze|Byafashe ku kibaho|Ibikoresho byashize
ti ሽሮፕ|ተሓዋዊሱ|ኣብ ሰሌዳ ተሓዚሉ|ኣቕሑ ወዲኡ
simple = en. rw, ti, fa-AF need a native check.

EDITS: pourlines.js (all), index.html and app.js (stamp sites), CHANGELOG.md, FIX-LIST.md ("Stage 23. Version locked: RF RF 1.0.22." [x] `pl-materials`, `pl-levels-8-21`, `pl-shapes-words`).

ACCEPT
1. 1366x768, no lines: level 13 and 21 show "Mixed up"; level 9 shows a lose card, never a win; the line (110,185)→(585,462) wins level 9.
2. Level 11 line (215,330)→(350,428): both jars show ✓ in under 12 s. Level 10 line (630,232)→(530,470): water wins.
3. 412x915 upright: 21 chips wrap with no clipping, ru and ti badge text not cut off, no horizontal scroll. 915x412: the four shapes can be told apart; Pour reachable.
4. 8 languages + Simple: material names, badges and lose titles change; only "Pour Lines" stays English.

Commit author: trebiluk <6373031+trebiluk@users.noreply.github.com>
Push to GitHub main and reply with the commit sha
````

---

