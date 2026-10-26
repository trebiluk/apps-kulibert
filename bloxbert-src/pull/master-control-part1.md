Bertopia 2.5.493 — Master Control Part 1 of N (page shell + read-only board)

Goal: a new staff page /master-control/ that everyone can VIEW read-only, and only the staff login can edit.

Changes
1. New master-control/index.html (+ master-control/mc.js, mc.css). Reuse shared/kulibert-bar.*, kulibert-theme-digital.css and shared/hub-staff-auth.js (isUnlocked()). No new auth, no custom crypto.
2. Board = read-only view of all relevant project info, loaded from master-control/board.json: app name, live version, lane/chat, status (Live / Building / Blocked / Waiting on Diego), one-line note. Seed it with Bertopia, Ramp & Fill, DJ Berty, and the 5 Bertopia lanes (BILL, BOOBS, BASSFISH, BALLER, BOB).
3. Staff unlocked: show an "Edit" toggle that edits rows in place and lets staff export the updated board.json (download). Not unlocked: no edit controls at all, plus a plain line saying "View only".
4. Placeholder "Teacher controls" panel (multiplayer switch, freeze, kick, rollback, chat moderation) as disabled, labeled cards that say "Coming with class server (class.kulibert.net)". No server calls.

Rules: calm colors (no neon, no flash), icon+text, keyboard focus visible, fat targets, works at 1366x768 and 412 wide. Aliases only, no student info.
Out of scope: server/Worker code, deploying, chat, TechWorks, any change to Bertopia game files.
Accept: logged out = view only, no edit buttons; staff unlocked = Edit works + export; fits 412 and 1366; no console errors. Live at /master-control/.

Commit author: trebiluk <6373031+trebiluk@users.noreply.github.com>
Push to GitHub main and reply with the commit sha
