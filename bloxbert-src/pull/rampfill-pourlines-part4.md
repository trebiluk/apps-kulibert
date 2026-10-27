## Part 4 of 6

````text
Ramp & Fill RF 1.0.25 — Pour Lines
Part 4 of 6: stars, saved progress, Solve. Parts 1-3 and RF 1.0.24 (home restyle) are on main: pull --rebase first, no force-push.

VERSION STAMP: Debugzy locks RF 1.0.25; never pick or lower it. Sites as in Part 1 (index.html title, #ver-plate, .ver-plate, #whats-body, data-version, 3 ?v=RF-… busters; app.js line-1 comment, VERSION, 9 `whats:` lines). whats = "RF 1.0.25 — " + en "Pour Lines now has stars and a Solve button." / uk "Pour Lines тепер має зірки й кнопку «Розв’язати»." / ru "В Pour Lines теперь есть звёзды и кнопка «Решить»." / es "Pour Lines ahora tiene estrellas y el botón Resolver." / ar "في Pour Lines الآن نجوم وزر حلّ." / fa-AF "Pour Lines حالا ستاره و دکمهٔ حل دارد." / rw "Pour Lines ifite inyenyeri n'ikinyabutabo Kemura." / ti "Pour Lines ሕጂ ኮኸብን ፍታሕ መልጎምን ኣለዎ።" / simple = en.

OUT OF SCOPE: new levels or physics; the ramp game's own stars and saves (rampfill_progress etc. untouched).

FIX 1 — stars and saves (pourlines.js).
- On a win f = inkUsed / (ink·100): f ≤ 0.45 = 3 stars, ≤ 0.75 = 2, else 1. Keep the best per level.
- Key "rampfill-pl-v1" = {"3":2,"7":3} (level index → stars, sparse). Every read and write in try/catch. cleanProg() on load keeps only integer keys 0-20 with integer values 1-3; bad JSON, null or anything else gives {}. Throwing storage must not break play.
- No alias, name, streak or network. Win card: star icons plus words ("2" + t("starsWord"), reuse starWord/starsWord), plus "Best" if it beat the old one. Still, no animation, never colour alone.
- Chips show a star icon + number (0 hides it); aria-label = PL.level + " N, 2 " + t("starsWord"). All 21 levels stay open. A total "12 / 63" with a star icon sits above the chips.
- "Reset stars": a link-style 44 px button at the foot of the rail, two-step: tap 1 shows PL.sure for 3 s, tap 2 clears the key.

FIX 2 — Solve. Button after Clear. Tap 1 = PL.sure for 3 s; tap 2 clears pen lines, draws the stored answer (each segment resampled every 8 px as pen strokes, counted as ink), rewinds, sets assisted = true. A win while assisted shows PL.helped, records no stars, keeps the old best. Retry, level change, or Rewind-with-Clear resets assisted. Never auto-press Pour. Answers (level: stroke / stroke, points x,y):
1 110,185 585,462
2 100,95 430,250 500,330 590,455
3 340,262 170,475 / 460,262 630,475
4 150,372 630,462
5 0,225 105,484 / 800,225 695,484 / 300,272 380,480 / 500,272 420,480
6 105,100 200,380 420,420 570,468
7 0,190 300,468 / 800,190 500,468
8 335,175 305,410 150,482 / 465,175 495,410 650,482
9 110,185 585,462
10 630,232 530,470
11 215,330 350,428
12 330,262 240,412 / 490,262 570,412
13 150,120 355,470 / 320,120 600,468
14 105,100 200,380 420,420 570,468
15 100,120 350,470 / 390,100 520,470 / 630,110 720,470
16 170,215 285,312 / 345,330 465,432 / 530,455 640,482
17 262,222 375,422 / 538,222 425,422
18 60,150 310,468 / 740,150 490,468
19 395,440 700,482
20 105,100 200,380 400,470 610,482
21 80,120 260,470 / 285,100 440,470 / 485,100 610,470
All use 1.7 to 11.9 ml, inside each level's budget.

FIX 3 — words. PL additions (solve | sure | helped | reset | total):
en Solve|Sure?|Solved with help. No stars.|Reset stars|Stars
uk Розв’язати|Точно?|Розв’язано з підказкою. Без зірок.|Скинути зірки|Зірки
ru Решить|Точно?|Решено с подсказкой. Без звёзд.|Сбросить звёзды|Звёзды
es Resolver|¿Seguro?|Resuelto con ayuda. Sin estrellas.|Borrar estrellas|Estrellas
ar حلّ|متأكد؟|حُلّ بمساعدة. بلا نجوم.|مسح النجوم|النجوم
fa-AF حل|مطمئنی؟|با کمک حل شد. بدون ستاره.|پاک کردن ستاره‌ها|ستاره‌ها
rw Kemura|Urabyemeza?|Byakemuwe n'ubufasha. Nta nyenyeri.|Siba inyenyeri|Inyenyeri
ti ፍታሕ|ርግጸኛ?|ብሓገዝ ተፈቲሑ። ኮኸብ የለን።|ኮኸባት ደምስስ|ኮኸባት
simple = en. rw, ti, fa-AF need a native check. No sound; a win never flashes.

EDITS: pourlines.js (all), index.html and app.js (stamp sites), CHANGELOG.md, FIX-LIST.md ("Stage 25. Version locked: RF 1.0.25." [x] `pl-stars`, `pl-saves`, `pl-solve`).

ACCEPT
1. 1366x768: level 1 with (110,185)→(585,462) earns 2 stars; level 3's two-line answer (5.45 of 14 ml) earns 3. Reload: chip 1 shows 2, total 2 / 63.
2. Solve on levels 1, 5, 13, 21 (tap twice, Space): each wins, reads "Solved with help", saved stars unchanged.
3. Set "rampfill-pl-v1" to "{{{" or {"0":9,"x":2}, reload: opens with 0 stars, no console error. With storage blocked, play still works.
4. 412x915 and 915x412: Solve and Reset stars are 44 px+ and reachable; 21 chips wrap cleanly.
5. 8 languages + Simple: Solve, Sure?, the helped line, Reset stars and the total change.

Commit author: trebiluk <6373031+trebiluk@users.noreply.github.com>
Push to GitHub main and reply with the commit sha
````
