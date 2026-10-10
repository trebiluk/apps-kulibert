# Bertopia 2.5.118 proof

PASS

- PASS chip 2.5.118 — {"chip":"2.5.118","js":"2.5.118","news":"A Woodshop Bench holds your Glasses, Tape, Saw and Hammer, and the shop rules show the first time."}
- PASS changelog — 2.5.118 · You are here · A Woodshop Bench holds your Glasses, Tape, Saw and Hammer, and the shop rules show the first time.

2.5.117 · Block ids stay frozen, and a missing pack shows as a crate until it returns.

2.5.113
- PASS drag craft glasses — {"d1":{"ok":true},"d2":{"ok":true},"madeG":"made","nG":1}
- PASS fill craft tape — made 1
- PASS drag craft saw — {"d1":{"ok":true},"d2":{"ok":true},"madeS":"made","nS":1}
- PASS fill craft hammer — made 1
- PASS fill craft bench — made 1
- PASS found spot — {"x":16,"y":5,"z":16}
- PASS no room — {"placed":false,"toast":"No room","face":"W","side":{"x":16,"y":5,"z":17},"anchor":0,"ghostOn":true}
- PASS place bench — {"ok":true,"info":{"id":69,"meta":{"kind":"woodshop","face":"W","role":"anchor","anchor":"16,5,16","pair":"16,5,17"},"face":"W","anchor":"16,5,16","wall":[]},"sideId":70,"face":"W","bag":0}
- PASS safety once — {"text":"Real shop rules: 1 Glasses on. 2 Measure twice, cut once. 3 Clamp it, don't hold it. 4 Cut away from your body. 5 Ask your teacher before using real tools.\n\nGot it","h":44,"w":402}
- PASS safety stays shut — false
- PASS drag safetyGlasses — {"ok":true,"cls":"wall-slot filled"}
- PASS drag measuringTape — {"ok":true,"cls":"wall-slot filled"}
- PASS drag handSaw — {"ok":true,"cls":"wall-slot filled"}
- PASS drag hammer — {"ok":true,"cls":"wall-slot filled"}
- PASS woodshop ready — {"ready":"1","lit":true,"wall":["safetyGlasses:wall-slot filled","measuringTape:wall-slot filled","handSaw:wall-slot filled","hammer:wall-slot filled"],"glasses":{"on":false,"mesh":false,"mark":""},"note":""}
- PASS glasses on — {"g":{"on":true,"mesh":true,"mark":"1"},"note":"Glasses on."}
- PASS needs saw after takeback — {"text":"Needs Saw","cls":"wall-slot empty","ready":"1","saw":1}
- PASS buttons 44 — {"n":17,"small":[]}
- PASS reload keeps bench — {"id":69,"face":"W","wall":["safetyGlasses","measuringTape","hammer"],"seen":true,"open":false}
- PASS needs saw when gone — {"ready":"0","miss":"Needs Saw"}
- PASS missing tool opens recipe — crafting tap true
- PASS full bag drops — {"ok":true,"before":{"dirt":1,"slots":15},"wall":["safetyGlasses","measuringTape","hammer"],"drops":["safetyGlasses:1","measuringTape:1","hammer:1","woodshop:1"],"bag":0,"dirt":1,"gone":0}
- PASS phone tap safetyGlasses — Needs Glasses
- PASS phone tap measuringTape — Needs Tape
- PASS phone tap handSaw — Needs Saw
- PASS phone tap hammer — Needs Hammer
- PASS phone ready — {"ready":"1","slots":[{"t":"✓","w":48,"h":58.640625},{"t":"✓","w":48,"h":58.640625},{"t":"✓","w":48,"h":58.640625},{"t":"✓","w":48,"h":58.640625}]}
- PASS phone needs saw — Needs Saw
- PASS rotate keeps panel — {"panel":"woodshop","hidden":false}
- PASS wide tap hangs saw — {"text":"✓","filled":true,"w":48,"h":58.640625}
- PASS rotate back — woodshop
- PASS strict shows card — {"open":true,"seen":true,"text":"Real shop rules: 1 Glasses on. 2 Measure twice, cut once. 3 Clamp it, don't hold it. 4 Cut away from your body. 5 Ask your teacher before using real tools.\n\nGot it"}
- PASS fresh survival — {"mode":"survival","ver":"2.5.118","voxel":10}
- PASS fresh creative — 2.5.118
- PASS no console errors — clean
