# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**King Fisher** is a single-page GO / NO-GO dive conditions dashboard for Sydney spearfishing and freediving. It scores current ocean conditions (swell, wind, tide, rain, water temp) on a 0–100 scale and returns a GO / MAYBE / NO-GO verdict.

## Running locally

No build step. Open `index.html` directly in a browser — the app works fully in demo mode out of the box.

For live data, deploy the proxy worker (see below) and configure it in the app's ⚙ settings modal.

## Architecture

Everything user-facing lives in **`index.html`** — HTML, CSS, and JavaScript are all inlined in a single file. There is no framework, no bundler, and no `package.json`.

**`js/king-fisher.js`** is a Cloudflare Worker (or Node/Express equivalent) that acts as a proxy to the WillyWeather API. It exists for two reasons:
1. WillyWeather doesn't send CORS headers, so the browser cannot fetch it directly.
2. It keeps the WillyWeather API key server-side (stored as a `WW_KEY` secret), never exposed in the page.

### Scoring engine (inside `index.html`)

The core of the app. Each factor returns a 0–1 sub-score, then a weighted sum produces the final 0–100 score.

| Factor | Weight | Key threshold |
|---|---|---|
| `swellHeight` | 30 | ≤0.8 m perfect, ~2.5 m blown out |
| `windSpeed` | 20 | ≤8 kn glassy, ~22 kn unusable |
| `rain` | 15 | linear off rain probability |
| `swellPeriod` | 10 | 9–14 s ideal groundswell |
| `windDir` | 10 | W/NW/SW offshore = 1.0, E/NE/SE onshore = 0.35 |
| `tide` | 10 | slack water (near turn) scores best |
| `waterTemp` | 5 | comfort only, 18–24 °C = 1.0 |

Verdict thresholds: **≥75 → GO**, **50–74 → MAYBE**, **<50 → NO-GO**.

`hourlyScore()` is a lighter version of the same calculation used to populate the hourly bar chart (excludes water temp).

### Data modes

- **Demo** (`buildDemoData()`): generates a plausible Sydney winter day entirely in-browser; no network calls.
- **Live** (`fetchLive()` → `parseWilly()`): calls `{proxy}/locations/{locationId}/weather.json?forecasts=...&days=1`. The proxy injects the `WW_KEY` env secret before forwarding to WillyWeather v2. Response is cached 10 minutes on the worker to limit billed API calls.

Settings (proxy URL, location ID, mode) are held in the `state` object and applied via the modal; they are not persisted across page reloads.

## Deploying the proxy worker

```bash
npm i -g wrangler
wrangler secret put WW_KEY   # paste your WillyWeather API key
wrangler deploy              # from the js/ directory
```

Paste the deployed worker URL into the app's settings modal → **Proxy base URL**.

The proxy whitelists forecast types (`wind`, `swell`, `tides`, `rainfallprobability`, `temperature`, `sunrisesunset`, `uv`, `weather`) and caps `days` at 3 to prevent abuse of the API key.

## Location IDs

WillyWeather uses numeric location IDs (not names). Sydney is `4950`. Find IDs for other coastal spots at [oztimes.mltindustries.com.au](https://oztides.mltindustries.com.au/).
