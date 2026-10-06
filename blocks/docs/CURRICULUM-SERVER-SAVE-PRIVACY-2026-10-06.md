Verdict: HOLD on the server save (plan §C.4 / S16 save-1) until Diego has the district's OK in writing. A no-server bridge can ship now. (Curriculum Bot, 2026-10-06 ~10:20 AM ET. Risk check, not legal advice.)

## Why it needs the district first (ranked)
1. **NY Ed Law 2-d / Part 121 (HIGH).** A kid's world saved under their hub alias is still student data. The teacher can link the alias to the child, so it counts as "personally identifiable" (linked or linkable), and FERPA uses the same test. Storing it on our own Cloudflare account puts student data outside the district's systems. Under Part 121 the district decides whether that's allowed. The usual path is the district's Data Protection Officer (DPO) or technology director approving it, which often means a written agreement with the Parents' Bill of Rights attached and a data security plan. Breaches must be reported to the district within 7 calendar days of discovery.
2. **FERPA (HIGH, same fix).** This only works if the district treats the store as under its "direct control" (the school-official exception). That's the same district approval as item 1.
3. **COPPA (MEDIUM).** Grades 6–8 include kids under 13, and a persistent ID counts as personal information. Stay inside the school-authorized, education-only use: no ads, no trackers, no analytics, and no selling or reusing the data.
4. **Free text in worlds (MEDIUM).** Signs, Blueprint titles and carved pumpkins can hold a real name. The crown viewer would show that to the class.
5. **Logs (LOW).** Cloudflare request logs can keep IP addresses. Keep logging to the minimum.

This is the same open question LawBot left about the hub and TechWorks (whether the DPO reviews them under Ed Law 2-d). **One ask to the district can cover all three: the hub, TechWorks and the Bertopia save.**

## What Diego signs off on before anything is built
1. **The district's OK in writing** (the DPO or tech director) for alias-keyed student work stored on the kulibert.net Cloudflare account. Diego sends it himself; no bot contacts the district. I'll draft a one-page data note for him to attach if he wants one.
2. **How long data is kept:** worlds are deleted 30 days after the school year ends, or when a student leaves. There's also a teacher "Delete this student's worlds" button, and parent deletion requests are done within 30 days.
3. **One line added to the parent notice** on the hub disclaimers page: "Bertopia worlds are saved under your child's class nickname so work isn't lost. No real names. Deleted each summer."

## Build rules once approved (Debugzy)
- `alias_ref` is an opaque random id, not the alias text and never an email. Nothing else about the kid is stored.
- The server checks that the signed-in alias owns the world before any read or write. Other kids get only the read-only crown viewer, which shows the alias only.
- Free text (signs, titles) runs through the existing name/word filter, and the teacher can hide any of it.
- No analytics or third-party scripts on the endpoint. Observability log retention stays at the minimum, with no IPs in app logs.
- HTTPS only. D1's encryption at rest is fine. Export/Import stays, so a kid can always take their own world with them.

## Bridge that ships now (no new student data on our server)
- **Save to Drive:** the Export button opens the Chromebook save picker with a "Save to Google Drive" tip. ChromeOS's Files app shows the kid's school Drive, which the district's Google Workspace agreement already covers. Import reads it back.
- Needs one check on a real Solvay Chromebook (StudentTester), since admin policy could hide Drive in the save picker.
- Keep the Export tip in What's new (plan risk table, line ~470).
