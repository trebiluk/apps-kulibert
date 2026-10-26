# DJ Berty — mixer device look (look-only) · 3 fixes

GOAL: make DJ Berty (apps.kulibert.net/music/) look like a physical mixer: separate panels with gaps between them, plus an optional calm RGB underlay. Look only, with no logic or audio changes.

ANCHOR ON IDS/CLASSES, NOT LINE NUMBERS (the Jam/Sound merge parts are queued): #dock-left, #piano-dock, the main tool area (#work (section.work) its id), #tip-dock, the Settings .theme-row.

FILES TOUCHED
- music/styles.css (most of the work)
- music/index.html (one Settings row only)
- music/app.js (toggle + slider wiring, save in localStorage)
- music/strings.js (2 labels)
- music/version.js + CHANGELOG.md (bump + "What's new: Mixer look + optional color glow-free underlay")

## Fix 1: panels become device sections
- #dock-left, the main tool area and #piano-dock each get the class `.mx-panel`:
  - background var(--panel)
  - border 2px solid var(--border)
  - border-radius var(--radius)
  - one hard shadow max (`0 2px 0 var(--border)`), no blur
- Gaps between panels are 12px at 1366 and 8px at 412, sitting on var(--bg) so the seams read as hardware.
- Each panel gets a small header strip: a 1px var(--divider) underline and an icon + 1–2 word label in the existing font. No new colors. Use only the existing theme vars, in calm and dark.
- Targets stay ≥48px. Don't shrink any control to fit.

## Fix 2: RGB underlay (off by default)
- Draw it as a 3px outline ring in the gap around each .mx-panel (`outline` or `box-shadow: 0 0 0 3px var(--mx-under)`, zero blur). No glow, no blur, no gradient animation.
- Colors: a static wash, one fixed hue per panel picked from a short calm set (teal #0F766E, slate blue #3B5B8C, amber #B7791F). Opacity comes from the brightness slider (20–70%, default 40%).
- NEVER cycle, pulse, flash or animate. Changes from the slider apply instantly with no transition.
- Under `prefers-reduced-motion`, same static result (there's no motion to remove). Also force it off in any high-contrast mode.
- Meaning never rides on the color. It's decoration only.

## Fix 3: Settings controls
- A new row under .theme-row:
  - an "Underlay" switch (role="switch", same style as #theme-switch, default OFF)
  - a "Brightness" range, shown only when the switch is on, with a visible value
- Save to localStorage `kulibert.music.underlay` = {on, level}. Reload keeps the choice.
- Keyboard-reachable, with visible focus, and the labels sit in strings.js.

## OUT OF SCOPE
- Audio, timing, tools, the Jam/Sound merge content, song data, theme var values, the dark mode switch behavior, the tip dock text and the piano key layout.
- No new fonts, no blur/backdrop-filter, no animation keyframes.

## STUDENTTESTER CHECKLIST (1366x768, then 412 upright and sideways)
1. Open /music/. You should see separate panels with visible gaps, like a mixer, in both calm and dark modes. Nothing overlaps and nothing is cut off at 412 sideways.
2. Settings: Underlay is OFF by default and no colored rings show.
3. Turn Underlay on: static colored rings appear in the gaps, with no blinking or cycling (watch 10s).
4. Drag Brightness from low to high: the rings dim and brighten instantly. Reload and the setting is kept.
5. Turn on OS reduced motion: same static rings, nothing moves.
6. Tab through the controls: the switch and slider are reachable, focus is visible, and every control is still ≥48px.

DONE only if you can see it working live; never fake a DONE.
GO from Diego Oct 25 2:03 PM ET. Queue: after merge Part 4.
