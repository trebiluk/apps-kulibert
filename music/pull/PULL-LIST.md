# DJ Berty PULL LIST — DJ_FIXXX only, until Tue Oct 27 6 AM ET (Debugzy)
Slow mode: one item per turn, top to bottom. Only ONE DJ chat works at a time (all items touch music/app.js).

Each item: `git pull` → read its file in `music/pull/` → if already done on main, check it off and skip → else ship it.
Version: next free MU 2.36.x after the newest on main (live is 2.36.58). Never reuse/lower. No force-push.
Limit: ≤3 fixes, ≤5 files. Two failed tries = stop, write BLOCKED + why under the item.
Do not change: sound engine, saving, song format, shared/kulibert-bar.js, shared/kulibert-prefs.js.
DONE only when seen live at apps.kulibert.net/music/ (1366 + 412 upright). Check the box here in the same commit.

- [x] 1-shelf-song-no-drums.md (Happy Birthday plays just the tune, right tempo) MU 2.36.59
- [x] 2-click-restore.md (saved click comes back on load; auto click turns off) MU 2.36.60
- [ ] 3-mixer-device-look.md (look only: mixer panels with gaps, optional calm underlay)

## Not yet (needs Debugzy after Tue)
Play+Sound merge parts, piano voice picker, calm-teal octave labels, DJ Berty 3.0 cuts.
