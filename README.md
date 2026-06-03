# King Fisher

A GO / NO-GO dive conditions dashboard for spearfishing and freediving at **Bondi Beach**, Sydney.

![Demo mode](https://img.shields.io/badge/mode-demo%20%7C%20live-brass)

## What it does

Scores current ocean conditions on a 0–100 scale and gives a clear verdict:

| Score | Verdict |
|---|---|
| 75–100 | **GO** — Clearance granted |
| 50–74 | **MAYBE** — Standby, assess on site |
| 0–49 | **NO-GO** — Mission abort |

### Scored factors

| Factor | Weight | Notes |
|---|---|---|
| Swell height | 30% | Ideal ≤ 0.4 m. Over 1.8 m = no-go |
| Wind speed | 18% | Ideal ≤ 5 kn glassy. 18 kn = 0 |
| Rain / runoff | 16% | Even 30% chance meaningfully degrades viz |
| Swell direction | 12% | S–SSE (155–185°) is gold standard for Bondi |
| Swell period | 10% | 12–16 s groundswell = clean. Wind swell < 8 s = murky |
| Tide timing | 8% | Slack water preferred; high tide pushes clean water in |
| Wind direction | 4% | W/NW/SW offshore holds the face clean |
| Water temp | 2% | Comfort / wetsuit thickness only |

### Additional panels

- **Kingfish encounter likelihood** — scored from 0–100 using seasonal presence data, water temperature, visibility, bait activity window, and time of day. Includes a 12-month presence calendar for Bondi.
- **Hourly ops window** — bar chart of dive score across daylight hours, highlighting the best window.
- **Runoff history** — 3-day rainfall indicator built into the Rain card.

## Running locally

No build step. Just open `index.html` in a browser — the app runs fully in **demo mode** out of the box with realistic Bondi conditions.

## Live data (optional)

Live readings come from the [WillyWeather API](https://www.willyweather.com.au/info/api.html) via a serverless proxy. The proxy keeps your API key server-side (browsers can't call WillyWeather directly due to CORS).

### Deploy the proxy (Cloudflare Worker)

```bash
npm i -g wrangler
wrangler secret put WW_KEY   # paste your WillyWeather API key
wrangler deploy              # deploy from the js/ directory
```

Then open the app, click **⚙ MISSION CONFIG**, switch to **LIVE**, and paste your worker URL.

### Alternative: Node / Express

A Node equivalent is included as a comment at the bottom of [`js/king-fisher.js`](js/king-fisher.js).

### Location IDs

WillyWeather uses numeric location IDs. Bondi Beach is set as the default (`16636` — verify via WillyWeather). Find IDs for other spots at [oztides.mltindustries.com.au](https://oztides.mltindustries.com.au/).

## Structure

```
king-fisher/
├── index.html        # Single-file app — all JS inline
├── css/
│   └── style.css     # Vintage military aesthetic
└── js/
    └── king-fisher.js # Cloudflare Worker proxy
```

## Safety

This is a planning aid, not a safety guarantee. Always check [BoM marine warnings](http://www.bom.gov.au/nsw/warnings/), dive with a buddy, and make the final call at the water's edge.
