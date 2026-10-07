# Drift 1.12.2

Builder accept on a fresh page (shared bar on), real touch and mouse. No element.click / dispatchEvent.

Short landscape (height <= 500) is two columns. Left: plate, 2.5rem title, the whole lede, what's new. Right: World, Start, Read aloud, Sound, Watch. Upright and laptop keep the single bottom stack.

## Door rects (touch, shared bar on)

915x412 en ltr beside-world. Lede (14,164,403x43). Clouds (428,130,74x44) Space (510,130,71x44) Reef (589,130,63x44) Start (428,179,176x48). elementFromPoint hits each. No line clipped.
844x390 en ltr beside-world. Lede (14,164,370x65). Same chips and Start, all >=44, all hit. Watch bottom 341 inside 390.
915x412 and 844x390 ar (rtl) and ti: beside-world, lede fully inside its column, chips and Start hit, no line clipped. RTL mirrors (lede on the right, chips on the left).
412x915 and 1366x768 en: above-world, same stack as 1.12.1 aside from the version plate and what's new line.

## Nearby

OK tap Space -> Start -> mouse drag steers (yaw -1.18 -> -2.35) in the starfield. Altitude stays ~1680 m.
OK Clouds -> Start flies (sky=day, door gone, 89 km/h).
OK Read aloud speaks the welcome line.
OK Rain aria-checked and Watch aria-pressed.
OK 915x412 sideways -> 412x915 -> 915x412 mid-play in Space: sky stays space, door stays gone, altitude keeps counting (1682 -> 1676 -> 1673), no reset.
OK back on the door, still beside-world and the targets still hit.
OK 0 console errors.

What's new: Drift: the welcome words fit on a sideways phone.
Shots: before/ is live 1.12.1. after/ is 1.12.2.
