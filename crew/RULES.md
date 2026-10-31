# Crew Board rules (Grok Build lanes T1, M1, M2, M3)

1. At start, `git fetch` and open `crew/BOARD.md` on the `crew-board` branch. Find your row (ID GB-<lane>), read the Brief link, set Status to WORKING, and update Updated (ET).
2. Edit only your own row, only on the `crew-board` branch. Don't add, delete or reorder rows. ManagerBot adds rows. Board edits are plain commits to `crew-board`. Never merge `crew-board` into main or main into it.
3. Do the code work on its own fix branch off main with a PR. Never push to main. No rebase and no force-push; if you need main's changes, merge main into your branch. Commit author: trebiluk <6373031+trebiluk@users.noreply.github.com>.
4. Status values: QUEUED → WORKING → DONE (PR open) or BLOCKED. ManagerBot alone sets PROVEN and LIVE. When done: Branch = branch name + PR link; Commit sha = PR head sha; Status DONE. Versions come from ManagerBot only; if none is set, write [VER].
5. Questions go in "Question for ManagerBot"; set Status BLOCKED. ManagerBot answers in "ManagerBot answer".
6. Never put secrets, keys, tokens, passwords, student names or student data in the board or the briefs. Use aliases only.
7. Only ManagerBot merges, publishes or ships.
8. Times in Updated (ET) are US Eastern, e.g. 2026-10-31 7:00 AM.
