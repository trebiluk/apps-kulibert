# Volt Duel FIX-LIST
Stage: Hub integration only. Version locked: VD 1.0.0.
Gameplay, physics, levels, controls, and scoring were not changed.

- [x] **VD 1.0.0 Static door:** Client-only HTML/JS/CSS in `voltduel/` with asset base `/voltduel/`. No server runtime, no SSR, no API routes. Source lives in `voltduel-src/`.
- [x] **VD 1.0.0 Hub tile + door:** Play tile opens `/voltduel/`. Live chip uses prefix VD and reads VD 1.0.0.
- [x] **VD 1.0.0 Bar:** Shared kulibert bar. Menu is top-left and follows RTL (`data-rtl="1"`). Plate is locked to VD 1.0.0. Back to Hub is in the menu. Full screen sits in the top corner, clear of the touch pads.
- [x] **VD 1.0.0 What's new:** The menu shows the VD 1.0.0 line in en, uk, ru, es, ar, fa-AF, rw, and ti.
- [x] **VD 1.0.0 Data:** Best times stay in localStorage (`volt-duel-v1`). No accounts, chat, trackers, ads, or analytics.

## Acceptance
- [x] Hub tile opens /voltduel/.
- [x] Qualifier can be raced on keyboard (VEX A/D/W/S, RIO arrows) and on the touch pads. Checked on the built files: both runners move, pads are at least 48px.
- [x] Chip reads VD 1.0.0.
- [x] Built page: no console errors, no failed same-origin resources, no page scroll, at 1366×768, 412×915, and 915×412.
