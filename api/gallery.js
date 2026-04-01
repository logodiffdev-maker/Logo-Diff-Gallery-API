export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const upstreamUrl = new URL("https://app.logodiffusion.com/auth/api/gallery");

    // forward query params exactly
    for (const [k, v] of Object.entries(req.query || {})) {
      if (Array.isArray(v)) v.forEach((vv) => upstreamUrl.searchParams.append(k, String(vv)));
      else upstreamUrl.searchParams.set(k, String(v));
    }

    const token = process.env.LD_AUTH_TOKEN || "";
    const cookie = process.env.LD_AUTH_COOKIE || "";

    const headers = { Accept: "application/json" };
    if (token) headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    if (cookie) headers.Cookie = cookie;

    const r = await fetch(upstreamUrl.toString(), { method: "GET", headers });

    const text = await r.text();
    res.status(r.status);
    res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
    return res.send(text);
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}