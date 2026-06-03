/* ============================================================
   WillyWeather proxy  —  Cloudflare Worker
   ------------------------------------------------------------
   Why this exists:
   1. CORS — WillyWeather doesn't send CORS headers, so a browser
      page CANNOT fetch it directly. This worker adds them.
   2. Secrecy — your API key lives here (server-side), never in
      the page where anyone could grab it and burn your quota.

   The app calls:
     {worker}/locations/{id}/weather.json?forecasts=...&days=1
   and this forwards it to WillyWeather with your key injected.

   DEPLOY (free tier is plenty):
   1. npm i -g wrangler   (or use the dash.cloudflare.com editor)
   2. Put your key in a secret:   wrangler secret put WW_KEY
   3. wrangler deploy
   4. Paste the worker URL into the app's settings → Proxy base URL
============================================================ */

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",            // tighten to your domain in production
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // browser preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);

    // Only allow the weather.json path we expect — don't become an open proxy.
    // Expected: /locations/{id}/weather.json
    const m = url.pathname.match(/^\/locations\/(\d+)\/weather\.json$/);
    if (!m) {
      return new Response(JSON.stringify({ error: "Bad path. Use /locations/{id}/weather.json" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const locationId = m[1];

    // Whitelist forecast types so nobody can craft expensive calls on your key.
    const allowed = new Set([
      "wind","swell","tides","rainfallprobability","rainfall",
      "temperature","sunrisesunset","uv","weather",
    ]);
    const requested = (url.searchParams.get("forecasts") || "wind,swell,tides")
      .split(",").map(s => s.trim()).filter(s => allowed.has(s));
    const days = Math.min(parseInt(url.searchParams.get("days") || "1", 10) || 1, 3);

    const target =
      `https://api.willyweather.com.au/v2/${env.WW_KEY}` +
      `/locations/${locationId}/weather.json` +
      `?forecasts=${requested.join(",")}&days=${days}`;

    try {
      const upstream = await fetch(target, { cf: { cacheTtl: 600 } }); // cache 10 min = fewer billed calls
      const body = await upstream.text();
      return new Response(body, {
        status: upstream.status,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }),
        { status: 502, headers: { ...cors, "Content-Type": "application/json" } });
    }
  },
};

/* ------------------------------------------------------------
   Prefer Node/Express instead? Same idea:

   import express from "express";
   const app = express();
   app.get("/locations/:id/weather.json", async (req, res) => {
     const f = (req.query.forecasts || "wind,swell,tides");
     const u = `https://api.willyweather.com.au/v2/${process.env.WW_KEY}` +
               `/locations/${req.params.id}/weather.json?forecasts=${f}&days=1`;
     const r = await fetch(u);
     res.set("Access-Control-Allow-Origin", "*").status(r.status).send(await r.text());
   });
   app.listen(8787);
------------------------------------------------------------ */
