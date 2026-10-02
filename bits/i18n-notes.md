# Bits & Bobs BB 2.0.3 — language notes

The door follows the Hub. `?lang=`, `KulibertPrefs.lang`, then `kulibert-prefs-v1`. If none of those is set, the language is English. `simple` is English in the Simple copy (`html lang=en`). Shared chrome words (Settings, Exit, Pause, Close, What's new, and the no-voice line) come from `KulibertI18n`. App strings live in `bits/i18n.js`, `bits/i18n-packs.js`, and `bits/i18n-packs2.js`.

## Needs a native check

I am not a native speaker of Dari, Kinyarwanda, or Tigrinya. Do not ship these lines as confirmed.

- **fa-AF (Dari), the whole table** in `bits/i18n-packs2.js`, including all 24 prompts. Choices that are meant to be Dari rather than Iranian Persian: صنف (class), چوکی (chair), تخته (board), فهرست (list). A Dari speaker should correct any Iranian Persian that slipped in.
- **rw (Kinyarwanda), the whole table**, including all 24 prompts.
- **ti (Tigrinya), the whole table**, including all 24 prompts. Ge'ez should stay LTR.

Ukrainian, Russian, Spanish, and Arabic were written for kids and should still get a quick read, but they are not on this list.

## For Diego

The widget board stays `dir=ltr` so saved `translate3d` positions do not slide. Arabic and Dari mirror the header and the Settings sheet (`inset-inline-start`). Widget labels and buttons inside a card can be RTL. Tape, sticks, keys, the pixel grid, the protractor, gears, the mat, and the noise meter stay LTR so `scrollLeft` stays sane.

**The bottom dock stays on the physical left in RTL** (`direction: ltr` on `.dock`). Plus, Big type, Projector, and Settings stay in that order from the left edge. This is the consistency choice from the brief. Flagged for Diego: say if the dock should flip to the right instead.

Classic (`?theme=classic`) stays English and LTR. The classic bar does not set `data-rtl`.
