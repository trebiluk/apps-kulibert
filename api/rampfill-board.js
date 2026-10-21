// Ramp & Fill score gate. A test post can land only on the TEST board.
// This route never writes the real rampfill board.
export default async function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  res.setHeader("access-control-allow-origin", "https://apps.kulibert.net");
  res.setHeader("access-control-allow-headers", "content-type, x-tw-desk");
  res.setHeader("access-control-allow-methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, written: false, error: "method" });

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const wantsTest = body.test === true || body.board === "TEST";
  if (!wantsTest) {
    return res.status(403).json({ ok: false, written: false, board: "real", error: "real board not written" });
  }

  const token = String(req.headers["x-tw-desk"] || "").trim();
  if (!token || token.length < 32) {
    return res.status(401).json({ ok: false, written: false, board: "TEST", error: "desk key" });
  }

  let gate = 401;
  try {
    const check = await fetch("https://tw.kulibert.net/api/desk", {
      headers: { "x-tw-desk": token }
    });
    gate = check.status;
  } catch (e) {
    gate = 401;
  }
  if (gate !== 200) {
    return res.status(401).json({ ok: false, written: false, board: "TEST", error: "desk key" });
  }

  const row = {
    alias: String(body.alias || "").slice(0, 24),
    board: "TEST",
    score: String(body.score || "").slice(0, 12),
    game: "rampfill",
    test: true
  };
  if (!row.alias || !row.score) {
    return res.status(400).json({ ok: false, written: false, board: "TEST", error: "need alias and score" });
  }
  return res.status(200).json({ ok: true, written: true, board: "TEST", row });
}
