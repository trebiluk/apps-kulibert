# Bertopia home hosting vs the school hub sign-in: risks

Nov 1 2026, BERTOPIA MAIN CODER, for Diego and ServerBot. This is a review only; it asks for no code. It is checked against main `296188bf` (2.5.596), `server/class-room/` and the class-server plans in the project.

## Bottom line
The game and the class server are built around one idea: **a school hub sign-in issues an identity, and only rostered kids join rooms that staff opened.** A localhost host for non-school use removes all three of those pieces: the issuer, the roster and the staff. If home hosting reuses the class server as it stands, it either won't connect at all or it will need the safety checks switched off. Treat it as **a separate build target with its own identity and roles**, and decide the policy questions in §3 before any code.

## 1. Things that will break (technical)

| # | Where | What happens on a home host |
|---|---|---|
| T1 | `classnet/config.js` `safeUrl` | Server URLs must be on `*.kulibert.net`, over `wss:`/`https:`. The only exception is `localhost`/`127.0.0.1` with the `bt-class-dev` flag, hard-wired to ports 8787/8788. **A second device on the home network (`192.168.x.x`) gets `null` and silently plays solo.** |
| T2 | `server/class-room` `token.js` + SECURITY.md | Join tickets are HMAC-signed by **TechWorks** with a shared secret. At home there's no TechWorks. A home issuer needs its own secret. It must **never** reuse or ship the school secret, and a home ticket must never be accepted by the school Worker (or the reverse). |
| T3 | Worker `originAllowed` / `REQUIRE_TLS` | Origin must be exactly `https://apps.kulibert.net` and TLS is required. Only `.dev.vars` relaxes this. A home host means adding LAN origins and plain `ws://`, which is the exact switch the security design treats as dev-only. |
| T4 | `save/server-sync.js` | World sync is hard-wired to `tw.kulibert.net` (`/api/who`, `/api/bertopia/world`) with `credentials: 'include'`. On a home host it fails CORS. With `?sync=1` the save chip would show **"Not saved"** even though the local save is fine. This confuses kids and parents. |
| T5 | Staff and teacher gates in `main.js` | `staffOn()` and `teacherOn()` depend on `HubStaffAuth.isUnlocked()`, the school staff passkey lock. At home **nobody can be a teacher**, so these are locked forever: Creative, town helper, protected-land editing, the rules editor and every planned grief tool (freeze, rollback, mute). Faking `HubStaffAuth` to unlock them would also unlock them on school builds that share the code. |
| T6 | `shared/kulibert-bar.js`, `kw-who.js`, `kw-test.js` | The hub bar, the sign-in pill and the test gate call kulibert.net APIs. On a home host these either error or show a "Sign in" that can't work. |
| T7 | Storage per origin | localStorage and IndexedDB are per origin. A world, Maker Pages, painted blocks or Notebook on `apps.kulibert.net` **don't exist** on `localhost:XXXX`, and the reverse is also true. Kids will think their stuff is gone. |
| T8 | Version skew | A home host is a snapshot. The protocol carries `v`, and Stage B adds a byte-identical shared `classworld.js`. Kids opening the school URL and the home URL get different versions, and an old home server will refuse a newer client, or worse, accept a mismatched palette. |
| T9 | Service worker | `bertopia/sw.js` caches by version; the blocks doors are kill-switches. A long-running localhost origin can hold a stale cache across host updates unless the version is stamped. |
| T10 | Ports | Wrangler dev uses 8787/8788 (the hard-wired dev pair in T1). Our checks use 8877, 8879 and 8881. A home host on any of these collides with dev and test runs on the same machine. |
| T11 | Runtime | The class server is a Cloudflare Worker with Durable Objects (`memdb`/`sqldb`). Running it at home means `wrangler dev`/Miniflare, which is a heavy Node setup for a family PC. Its persistence and limits also differ from production, so "passes at home" won't mean "passes at school." |

## 2. Things that could hurt kids (safety and privacy)

| # | Risk | Why it matters |
|---|---|---|
| S1 | **Kids under 13, no roster** | At school only rostered kids join, and staff open rooms. At home, anyone who can reach the host can join. Bound to `0.0.0.0`, or port-forwarded "so my friend can play," it becomes an open server for strangers. |
| S2 | **Typed names** | Aliases come from the hub (picked or generated, never typed). A home join screen without the hub invites kids to type real names, and those reach every client's nameplate. |
| S3 | **No adult role** | The school model always has a teacher with kick, freeze and rollback. At home, with no adult role (T5), grief and unkind behaviour have no tool to stop them. |
| S4 | **Chat** | Typed chat is OFF by design; quick chat is ids only. A home build mustn't quietly add free text "because it's not school." |
| S5 | **Same code, two policies** | The plans say, in every Stage B part: *"No kid-run servers, hosting, invite codes or join codes; only rostered kids join."* The security doc says there's **no message** for hosting or inviting, and kids who send one are dropped. Home hosting is the opposite policy, so it must never leak into the school build. A shared flag or UI string is the realistic leak path. |
| S6 | **District coverage** | The district OK and Diego's Oct 16 no-PII go cover school use on the kulibert.net account. They don't cover a family running a server. |

## 3. Decisions needed before code (Diego, with Curriculum for S-items)
1. **Who is it for?** One family's devices on one home network, a club, or the public? Each step out needs more safety work. Recommended: **one home network only**.
2. **Who is the adult?** A "host owner" role, unlocked by a PIN set at install, never the school passkey. It gets the teacher tools (kick, freeze, rollback, mute).
3. **Identity:** aliases from the same word-list generator, never typed. Is the school alias carried over? Recommended: no; home aliases are separate.
4. **Rules carried over unchanged:** no PII, quick chat only, PvP off, the inclusion rules. Recommended: all of them, because the code is shared.
5. **Does a home world ever come back to school?** Recommended: no. Export a file and import it through the existing save path, with no server link.

## 4. Recommended shape (if Diego says go)
- **A separate build target** (`HOME_HOST` build flag, default off). The school bundle stays byte-for-byte free of hosting UI, invite words and LAN origins. Add a check that greps the school `app.js` for `host`, `invite`, `join code` and LAN origins, like the existing `classnet-ui-check` key rule.
- **A home issuer with its own secret,** generated at install and stored only on the host. Tickets are refused cross-environment, with a different `cfg` id set or issuer tag.
- **Bind `127.0.0.1` by default.** Allow other devices only with an explicit "let devices on my home network join" switch, plus an IP allowlist. Never offer port forwarding or tunnelling instructions.
- **Turn off school pieces in the home build:** `server-sync` (school saves), the hub bar sign-in and the test gate. The save chip shows the local save only.
- **Host-owner role** replaces `HubStaffAuth` through a separate `homeOwnerOn()` that is only compiled into the home build. Never patch `staffOn()`.
- **Version handshake:** the home server reports its version, and an older or newer client gets a clear "Update the home server" card (icon + text, 9 languages).
- **Ports:** pick a home default outside 8787, 8788, 8877, 8879 and 8881, and make it configurable.

## 5. What already works at home with no server
Single player runs today from any static file server: worlds, Maker Pages, painted blocks, Default block, Notebook and all 9 languages. **If the goal is "play Bertopia at home," that's done.** Only *multiplayer* at home needs everything above.
