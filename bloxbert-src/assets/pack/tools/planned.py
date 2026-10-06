# Assets for later stages: PLANNED, NOT DRAWN. They sit in MANIFEST.csv with made_by=planned and no file, so the pack can grow toward them.
# id, type, stage, note
PLANNED = [
 # culture items in the one pile (art limits: CURRICULUM-PILE-CULTURE-ITEMS-CHECK-2026-10-06)
 ('block:blueWhiteLights','block-texture','holidays-1','plain bulb string, blue #60A5FA + soft white #DCE6F0; no menorah shape, no star'),('block:wovenMat','block-texture','holidays-1','plain weave red/black/green; no kinara, no candles'),
 ('block:harvestBasket','block-texture','holidays-1','fruit and corn in a basket'),('block:redLantern','block-texture','holidays-1','round red lantern, steady LED; no figures, no incense'),
 ('block:paperDragon','block-texture','holidays-1','friendly paper dragon, steady LED; no god figures'),('block:fanousLantern','block-texture','holidays-1','geometric lantern body; no crescent or star on top'),
 ('block:colourSplash','block-texture','holidays-1','matte paint splats, no neon'),('block:springGreens','block-texture','holidays-1','a dish of sprouted grass only'),
 ('block:kindnessHeart','block-texture','holidays-1','hearts, flowers'),('block:solarFlower','block-texture','holidays-1','flower with a small solar face'),
 ('block:imigongoTile','block-texture','holidays-1','black/white/red zigzag geometry'),('block:petrykivkaTile','block-texture','holidays-1','painted flower sprays, no figures'),
 ('block:mesobBasket','block-texture','holidays-1','tall woven basket with lid'),
 # world-3 / economy
 ('lavaBlock','block-texture','world-3','Molten rock look; contact = bounce to safety, never death (EFFECTS/WORLDS)'),('magmaPool','block-texture','world-3','glow edge, Motion-off = no shimmer'),
 ('meteorite','block-texture','world-3','meteor-fall find; iron-nickel look'),('iridiumOre','block-texture','world-3','legendary; sifted from Boundary Clay'),('rhodiumOre','block-texture','world-3','very rare'),
 ('tradePost','block-texture','world-3','Trade Post station front'),('walletPanel','ui-icon','world-3','Wallet in the Bag'),('embercoreUpgrade','item-icon','world-3','Smelter upgrade for Pt/Ti'),
 ('hangingIsleGrass','block-texture','world-4','floating islands'),('hangingIsleRock','block-texture','world-4','floating islands underside'),('cloudBlock','block-texture','world-4','walkable cloud, no pure white'),
 ('geologyNightRegrow','sfx','world-3','soft regrow sparkle at Geology Night'),
 # Molten Chasm / Circuit Daily / Daily Board / boards
 ('chasmGate','block-texture','chasm-1','Molten Chasm entry gate'),('chasmPlatform','block-texture','chasm-1','moving platform top'),('chasmCheckpoint','block-texture','chasm-1','checkpoint flag'),
 ('chasmSting','music','chasm-1','run start/finish stings'),('circuitBoardTile','block-texture','circuit-1','Circuit Daily board floor'),('circuitGoalLamp','block-texture','circuit-1','goal lamp off/on'),
 ('logicGateAnd','block-texture','circuit-1','AND gate face'),('logicGateOr','block-texture','circuit-1','OR gate face'),('logicGateNot','block-texture','circuit-1','NOT gate face'),('timerBlock','block-texture','circuit-1','timer/delay block'),
 ('sensorPlate','block-texture','circuit-1','pressure/step plate'),('dailyBoard','block-texture','daily-1','Daily Board station face'),('dailyStamp','ui-icon','daily-1','Daily stamp'),
 ('scoreBoardBlock','block-texture','boards-1','in-world high-score board face'),('medalBronze','item-icon','boards-1','board medal'),('medalSilver','item-icon','boards-1','board medal'),('medalGold','item-icon','boards-1','board medal'),
 # progression / achievements / looks
 ('tierBadge1-7','ui-icon','ladder-1','T1..T7 badges (7 files)'),('achievementFrame','ui-icon','achieve-1','achievement card frame'),('starEmpty','ui-icon','achieve-1','star outline'),('starFull','ui-icon','achieve-1','star filled'),
 ('looksHatSet','sprite','looks-1','8 hats for the looks shop (cosmetic only)'),('looksTrailSet','sprite','looks-1','6 gentle trails; Motion-off = none'),('looksSkinTints','sprite','looks-1','player tint palette'),
 ('looksBotPaint','sprite','looks-1','bot paint jobs'),
 # effects II / III
 ('effectRingTimer','ui-icon','effects-1','timer ring around effect icon'),('stoneSkinVial','item-icon','effects-2','tier II effect'),('featherFallVial','item-icon','effects-2','tier II'),('nightEyeVial','item-icon','effects-2','tier II'),
 ('magnetBoots','item-icon','effects-2','tier II'),('jetPackLite','item-icon','effects-3','tier III, timed glide'),('shrinkRay','item-icon','effects-3','tier III, looks only'),('crewShield','item-icon','effects-3','tier III'),
 ('effectParticles','sprite','effects-1','soft sparkle sheet, no flash'),
 # music
 ('djBertyLinkDisc','item-icon','music-2','disc that plays a DJ Berty song via link (mixes stay in DJ Berty, not this pack)'),('xylophone','block-texture','music-2','instrument'),('harp','block-texture','music-2','instrument'),
 ('inst_harp','sfx','music-2','C4 sample'),('inst_xylo','sfx','music-2','C4 sample'),
 # Seasonal & Holiday pile additions (one pile, one teacher switch; culture-specific extras need Diego + Curriculum OK)
 ('winterLightsPattern','block-texture','holidays-2','twinkle frames (4), slow, no flash'),('icicleDeco','block-texture','holidays-2','decor'),('snowGlobe','block-texture','holidays-2','decor'),
 ('lanternFestival','block-texture','holidays-3','paper lantern deco (name pending Curriculum)'),('springBlossom','block-texture','holidays-3','blossom leaves'),('heartGarland','block-texture','holidays-3','decor'),
 ('newYearBanner','block-texture','holidays-3','decor'),('carvePanelStencils','ui-icon','holidays-1','8 starter face stencils for the carve panel'),
 # furniture
 ('sofa','block-texture','furniture-2','2-wide seat'),('bed','block-texture','furniture-2','bed = Bunk look variant'),('lamp','block-texture','furniture-2','floor lamp on power rules'),('rug','block-texture','furniture-2','flat rug 4 colours'),
 ('pictureFrame','block-texture','furniture-2','shows a Bertodex picture'),('plantPot','block-texture','furniture-2','holds a flower'),
 # structures / ladder materials
 ('trussBlock','block-texture','ladder-2','steel truss'),('cableStay','block-texture','ladder-2','wire rope span'),('archStone','block-texture','ladder-2','keystone arch piece'),('solarRoof','block-texture','ladder-2','solar roof tile'),
 ('stressOverlay','sprite','ladder-2','load colours with pattern (never colour-only)'),
 # critters (effects-1 sprites are drawn; animation frames planned)
 ('critterAnimFrames','sprite','effects-1','2-frame idle per critter, Motion-off = still'),
]
